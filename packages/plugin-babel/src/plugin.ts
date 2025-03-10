import path from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { castArray, cloneDeep, SCRIPT_REGEX } from '@rsbuild/shared';
import { applyUserBabelConfig, BABEL_JS_RULE } from './helper';
import type { PluginBabelOptions } from './types';

/**
 * The `@babel/preset-typescript` default options.
 */
export const DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS = {
  allowNamespaces: true,
  allExtensions: true,
  allowDeclareFields: true,
  // aligns Babel's behavior with TypeScript's default behavior.
  // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
  optimizeConstEnums: true,
  isTSX: true,
};

export const pluginBabel = (
  options: PluginBabelOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:babel',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const getBabelOptions = () => {
        const baseConfig = {
          plugins: [],
          presets: [
            // TODO: only apply preset-typescript for ts file (isTSX & allExtensions false)
            [
              require.resolve('@babel/preset-typescript'),
              DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
            ],
          ],
        };

        const userBabelConfig = applyUserBabelConfig(
          cloneDeep(baseConfig),
          options.babelLoaderOptions,
        );

        return {
          babelrc: false,
          configFile: false,
          compact: isProd,
          ...userBabelConfig,
        };
      };

      const babelOptions = getBabelOptions();
      const babelLoader = path.resolve(
        __dirname,
        '../compiled/babel-loader/index.js',
      );
      const { include, exclude } = options;

      if (include || exclude) {
        const rule = chain.module.rule(BABEL_JS_RULE);

        if (include) {
          castArray(include).forEach((condition) => {
            rule.include.add(condition);
          });
        }
        if (exclude) {
          castArray(exclude).forEach((condition) => {
            rule.exclude.add(condition);
          });
        }

        const swcRule = chain.module.rules
          .get(CHAIN_ID.RULE.JS)
          .use(CHAIN_ID.USE.SWC);
        const swcLoader = swcRule.get('loader');
        const swcOptions = swcRule.get('options');

        rule
          .test(SCRIPT_REGEX)
          .use(CHAIN_ID.USE.SWC)
          .loader(swcLoader)
          .options(swcOptions)
          .end()
          .use(CHAIN_ID.USE.BABEL)
          .loader(babelLoader)
          .options(babelOptions);
      } else {
        // already set source.include / exclude in plugin-swc
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);
        rule
          .test(SCRIPT_REGEX)
          .use(CHAIN_ID.USE.BABEL)
          .after(CHAIN_ID.USE.SWC)
          .loader(babelLoader)
          .options(babelOptions);
      }
    });
  },
});
