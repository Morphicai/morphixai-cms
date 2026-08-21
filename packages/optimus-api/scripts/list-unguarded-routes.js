#!/usr/bin/env node
/**
 * 列出所有没挂 @Perm 的管理接口——下一轮"默认拒绝"收紧的输入清单。
 *
 * 静态扫源码而不是反射运行时路由：不用起服务、不用连库，产出直接对着
 * 控制器文件改。@AllowAnonymous / @AllowNoPerm / AuthMode.CLIENT_USER 的
 * 控制器是有意豁免的，单独归类，别当成漏网之鱼。
 */
const { readFileSync } = require('node:fs');
const { execSync } = require('node:child_process');

const files = execSync(
  `find src -name '*.controller.ts' -not -path '*/node_modules/*'`,
  { encoding: 'utf8', cwd: __dirname + '/..' },
).trim().split('\n');

const guarded = [];
const exempt = [];
const unguarded = [];

for (const f of files) {
  const src = readFileSync(`${__dirname}/../${f}`, 'utf8');
  const cls = (src.match(/@Controller\(["']?([^"')]*)/) || [])[1] ?? '?';
  if (/@Perm\(/.test(src)) guarded.push(`${f}  (/${cls})`);
  else if (/@AllowAnonymous|AuthMode\.CLIENT_USER|@AllowNoPerm/.test(src)) exempt.push(`${f}  (/${cls})`);
  else unguarded.push(`${f}  (/${cls})`);
}

const print = (title, list) => {
  console.log(`\n${title} (${list.length})`);
  list.forEach((x) => console.log('  ' + x));
};
print('已打标 @Perm', guarded);
print('有意豁免(匿名/C端/显式无权限)', exempt);
print('【待处理】无标注、认证后即放行', unguarded);
