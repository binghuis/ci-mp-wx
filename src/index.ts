import NanoJson from '@bit2byte/nano-json';
import p from '@clack/prompts';
import kleur from 'kleur';
import { Project, upload } from 'miniprogram-ci';
import path from 'path';
import semver from 'semver';
import { PackageJson } from 'type-fest';

async function main() {
  console.log(kleur.bgYellow('请使用 yarn 安装项目依赖，否则可能会出现上传失败的情况'));
  console.log(kleur.bgGreen('yarn 安装：https://classic.yarnpkg.com/en/docs/install'));

  const project = new Project({
    appid: '',
    type: 'miniProgram',
    projectPath: 'dist/build/mp-weixin',
    privateKeyPath: 'private.key',
    ignores: ['node_modules/**/*'],
  });

  const pkg = new NanoJson<PackageJson>(path.resolve(__dirname, '../package.json'));

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
    },
  });
  if (pkg.d) {
    pkg.d.version = commit.version;
  }
  await pkg.w();
  console.log(uploadResult);
  p.log.success(kleur.green('代码上传完成！'));
}

main().catch((e) => {
  p.log.error(e);
  process.exit(1);
});
