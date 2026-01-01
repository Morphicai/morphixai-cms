#!/usr/bin/env node

/**
 * 权限系统简化迁移脚本
 * 
 * 功能：
 * 1. 检查当前权限系统状态
 * 2. 验证common包菜单配置
 * 3. 生成迁移报告
 * 4. 提供清理建议
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function checkCommonPackage() {
  log('blue', '\n📦 检查Common包配置...');

  const commonPackagePath = path.join(__dirname, '../../common/package.json');
  const menusPath = path.join(__dirname, '../../common/constants/menus.js');
  const permissionPath = path.join(__dirname, '../../common/utils/permission.js');

  const results = {
    packageJson: checkFileExists(commonPackagePath),
    menusConstant: checkFileExists(menusPath),
    permissionUtils: checkFileExists(permissionPath)
  };

  if (results.packageJson) {
    log('green', '  ✅ package.json 存在');
  } else {
    log('red', '  ❌ package.json 不存在');
  }

  if (results.menusConstant) {
    log('green', '  ✅ 菜单常量文件存在');
  } else {
    log('red', '  ❌ 菜单常量文件不存在');
  }

  if (results.permissionUtils) {
    log('green', '  ✅ 权限工具文件存在');
  } else {
    log('red', '  ❌ 权限工具文件不存在');
  }

  return results;
}

function checkBackendFiles() {
  log('blue', '\n🔧 检查后端文件...');

  const files = [
    'src/apis/permission.js',
    'src/utils/PermissionManager.js',
    'src/constants/routes.js',
    'src/shared/components/Panel/ConstantSiderMenus.jsx',
    'src/router/RouteManager.jsx'
  ];

  const results = {};

  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = checkFileExists(filePath);
    results[file] = exists;

    if (exists) {
      log('green', `  ✅ ${file}`);
    } else {
      log('red', `  ❌ ${file}`);
    }
  });

  return results;
}

function checkRbacServerFiles() {
  log('blue', '\n🔐 检查RBAC服务文件...');

  const files = [
    'src/system/perm/perm.service.ts',
    'src/system/perm/perm.controller.simplified.ts'
  ];

  const results = {};

  files.forEach(file => {
    const filePath = path.join(__dirname, '../../optimus-api', file);
    const exists = checkFileExists(filePath);
    results[file] = exists;

    if (exists) {
      log('green', `  ✅ ${file}`);
    } else {
      log('red', `  ❌ ${file}`);
    }
  });

  return results;
}

function validateMenuConfiguration() {
  log('blue', '\n📋 验证菜单配置...');

  try {
    // 这里应该导入并验证菜单配置
    // 由于是Node.js环境，需要特殊处理ES模块
    log('yellow', '  ⚠️  菜单配置验证需要在浏览器环境中进行');
    log('yellow', '  💡 请在开发环境中打开浏览器控制台查看验证结果');

    return { valid: true, message: '需要在浏览器环境中验证' };
  } catch (error) {
    log('red', `  ❌ 菜单配置验证失败: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

function generateMigrationReport() {
  log('blue', '\n📊 生成迁移报告...');

  const commonCheck = checkCommonPackage();
  const backendCheck = checkBackendFiles();
  const rbacCheck = checkRbacServerFiles();
  const menuValidation = validateMenuConfiguration();

  const report = {
    timestamp: new Date().toISOString(),
    common: commonCheck,
    backend: backendCheck,
    rbac: rbacCheck,
    menuValidation,
    summary: {
      commonReady: Object.values(commonCheck).every(v => v),
      backendReady: Object.values(backendCheck).every(v => v),
      rbacReady: Object.values(rbacCheck).every(v => v),
      overallReady: false
    }
  };

  report.summary.overallReady =
    report.summary.commonReady &&
    report.summary.backendReady &&
    report.summary.rbacReady;

  return report;
}

function printSummary(report) {
  log('blue', '\n📈 迁移状态总结:');

  if (report.summary.commonReady) {
    log('green', '  ✅ Common包配置完成');
  } else {
    log('red', '  ❌ Common包配置未完成');
  }

  if (report.summary.backendReady) {
    log('green', '  ✅ 前端文件配置完成');
  } else {
    log('red', '  ❌ 前端文件配置未完成');
  }

  if (report.summary.rbacReady) {
    log('green', '  ✅ 后端服务配置完成');
  } else {
    log('red', '  ❌ 后端服务配置未完成');
  }

  if (report.summary.overallReady) {
    log('green', '\n🎉 权限系统简化迁移已完成！');
    log('blue', '\n📝 后续步骤:');
    log('yellow', '  1. 启动开发服务器测试功能');
    log('yellow', '  2. 在浏览器中验证菜单配置');
    log('yellow', '  3. 测试权限控制是否正常工作');
    log('yellow', '  4. 更新用户角色权限配置');
  } else {
    log('red', '\n❌ 权限系统简化迁移未完成');
    log('blue', '\n📝 需要完成的任务:');

    if (!report.summary.commonReady) {
      log('yellow', '  - 完成Common包配置');
    }
    if (!report.summary.backendReady) {
      log('yellow', '  - 完成前端文件配置');
    }
    if (!report.summary.rbacReady) {
      log('yellow', '  - 完成后端服务配置');
    }
  }
}

function provideMigrationGuidance() {
  log('blue', '\n💡 迁移指导:');

  log('yellow', '\n1. 路由配置:');
  log('blue', '   系统现在默认使用常量路由方案');
  log('green', '   无需额外的环境变量配置');

  log('yellow', '\n2. 数据库权限配置:');
  log('blue', '   确保用户角色拥有正确的菜单权限');
  log('blue', '   权限编码应该匹配菜单常量中的code字段');

  log('yellow', '\n3. 测试步骤:');
  log('blue', '   - 使用超级管理员账户登录测试');
  log('blue', '   - 使用普通用户账户测试权限控制');
  log('blue', '   - 检查菜单显示是否正确');
  log('blue', '   - 验证路由跳转是否正常');

  log('yellow', '\n4. 故障排除:');
  log('blue', '   - 检查浏览器控制台是否有错误');
  log('blue', '   - 确认API接口返回正确的权限数据');
  log('blue', '   - 验证菜单常量配置是否正确');
}

// 主函数
function main() {
  log('green', '🚀 权限系统简化迁移检查工具');
  log('blue', '='.repeat(50));

  const report = generateMigrationReport();

  // 保存报告到文件
  const reportPath = path.join(__dirname, '../migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('blue', `\n📄 详细报告已保存到: ${reportPath}`);

  printSummary(report);
  provideMigrationGuidance();

  log('blue', '\n' + '='.repeat(50));
  log('green', '✨ 检查完成');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkCommonPackage,
  checkBackendFiles,
  checkRbacServerFiles,
  validateMenuConfiguration,
  generateMigrationReport
};