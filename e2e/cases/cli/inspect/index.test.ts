import path from 'path';
import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { globContentJSON } from '../../../scripts/helper';

test('should run inspect command correctly', async () => {
  execSync('npx rsbuild inspect', {
    cwd: __dirname,
  });

  const files = await globContentJSON(path.join(__dirname, 'dist'));
  const fileNames = Object.keys(files);

  const rsbuildConfig = fileNames.find((item) =>
    item.includes('rsbuild.config.js'),
  );
  expect(rsbuildConfig).toBeTruthy();
  expect(files[rsbuildConfig!]).toContain("'rsbuild:basic'");
  expect(files[rsbuildConfig!]).toContain('hmr: true');

  const rspackConfig = fileNames.find((item) =>
    item.includes('rspack.config.web.js'),
  );
  expect(rspackConfig).toBeTruthy();
  expect(files[rspackConfig!]).toContain("mode: 'development'");
});

test('should run inspect command with output option correctly', async () => {
  execSync('npx rsbuild inspect --output foo', {
    cwd: __dirname,
  });

  const outputs = await globContentJSON(path.join(__dirname, 'dist/foo'));
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.includes('rsbuild.config.js')),
  ).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('rspack.config.web.js')),
  ).toBeTruthy();
});
