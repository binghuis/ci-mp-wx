#! /usr/bin/env node

import NanoJson from '@bit2byte/nano-json';
import p from '@clack/prompts';
import { bundleRequire } from 'bundle-require';
import JoyCon from 'joycon';
import kleur from 'kleur';
import { Project, upload } from 'miniprogram-ci';
import { ICreateProjectOptions } from 'miniprogram-ci/dist/@types/ci/project';
import { MiniProgramCI } from 'miniprogram-ci/dist/@types/types';
import path from 'path';
import semver from 'semver';
import { PackageJson } from 'type-fest';

export type CIMpWXConfig = {
  project: ICreateProjectOptions;
  upload: {
    setting?: MiniProgramCI.ICompileSettings;
    robot?: number;
    threads?: number;
    useCOS?: boolean;
    onProgressUpdate?: (task: MiniProgramCI.ITaskStatus | string) => void;
    allowIgnoreUnusedFiles?: boolean;
  };
};

const cancel = (message?: string) => {
  p.cancel(message ?? '✖ 已取消');
  process.exit(0);
};

async function main() {
  p.log.info(kleur.yellow('推荐使用 yarn 管理依赖，否则可能出现上传失败'));
  p.log.message(kleur.green('yarn 安装：https://classic.yarnpkg.com/en/docs/install'));

  const cwd = process.cwd();
  const configJoycon = new JoyCon();
  const configPath = await configJoycon.resolve({
    files: ['ci-mp-wx.config.ts', 'ci-mp-wx.config.mts'],
    cwd,
    stopDir: path.parse(cwd).root,
  });
  const { mod } = await bundleRequire({
    filepath: configPath ?? '',
  });

  const config: CIMpWXConfig = mod.default;

  if (!config.project.privateKeyPath) {
    cancel('未配置 privateKeyPath');
  }

  const privateKeyPath = path.join(cwd, config.project.privateKeyPath ?? '');

  const project = new Project({
    appid: config.project.appid,
    type: config.project.type ?? 'miniProgram',
    projectPath: config.project.projectPath ?? 'dist/build/mp-weixin',
    privateKeyPath,
    ignores: config.project.ignores ?? ['node_modules/**/*'],
  });

  const pkg = new NanoJson<PackageJson>(path.join(cwd, './package.json'));

  await pkg.r();

  const prevVersion = pkg.d?.version ?? '0.0.0';

  const commit = await p.group(
    {
      version: () =>
        p.text({
          message: kleur.cyan('输入本次提交版本号'),
          placeholder: prevVersion,
          initialValue: prevVersion,
          validate(value) {
            if (!semver.valid(value)) {
              return '请输入正确的版本号';
            } else if (semver.valid(prevVersion)) {
              if (semver.lte(value, prevVersion)) {
                return '版本号必须大于上次提交版本号';
              }
            }
          },
        }),
      desc: () =>
        p.text({
          message: kleur.cyan('输入提交备注'),
          placeholder: '',
          initialValue: '',
        }),
    },
    {
      onCancel: ({ results }) => {
        p.cancel('✖ 已取消');
        process.exit(0);
      },
    },
  );

  p.log.info(kleur.green('代码开始上传...'));
  const uploadResult = await upload({
    project,
    version: commit.version,
    desc: commit.desc,
    setting: {
      es6: true,
      es7: true,
      minify: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
      autoPrefixWXSS: true,
      ...config.upload.setting,
    },
    robot: config.upload.robot,
    threads: config.upload.threads,
    useCOS: config.upload.useCOS,
    onProgressUpdate: config.upload.onProgressUpdate,
    allowIgnoreUnusedFiles: config.upload.allowIgnoreUnusedFiles,
  });
  if (pkg.d) {
    pkg.d.version = commit.version;
  }
  await pkg.w();
  console.log(uploadResult);
  p.log.success(kleur.green('代码上传完成！'));
}

main().catch((e) => {
  p.log.error(kleur.red(e.message));
  process.exit(1);
});
