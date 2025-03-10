import type { RsbuildPlugin } from '@rsbuild/core';
import { deepmerge, STYLUS_REGEX, mergeChainedOptions } from '@rsbuild/shared';

type StylusOptions = {
  use?: string[];
  include?: string;
  import?: string;
  resolveURL?: boolean;
  lineNumbers?: boolean;
  hoistAtrules?: boolean;
};

type StylusLoaderOptions = {
  stylusOptions?: StylusOptions;
  sourceMap?: boolean;
};

export type PluginStylusOptions = StylusLoaderOptions;

export function pluginStylus(options?: PluginStylusOptions): RsbuildPlugin {
  return {
    name: 'rsbuild:stylus',

    setup(api) {
      const { bundlerType } = api.context;
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const mergedOptions = mergeChainedOptions({
          defaults: {
            sourceMap: config.output.sourceMap.css,
          },
          options,
          mergeFn: deepmerge,
        });

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.STYLUS)
          .test(STYLUS_REGEX);

        const { applyBaseCSSRule } = await import(
          bundlerType === 'webpack'
            ? '@rsbuild/webpack/plugin-css'
            : '@rsbuild/core/provider'
        );
        await applyBaseCSSRule({
          rule,
          config: config as any,
          context: api.context,
          utils,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });

      bundlerType === 'rspack' &&
        (api as any).modifyRspackConfig(async (rspackConfig: any) => {
          const { applyCSSModuleRule } = await import('@rsbuild/core/provider');

          const config = api.getNormalizedConfig();

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, STYLUS_REGEX, config as any);
        });
    },
  };
}
