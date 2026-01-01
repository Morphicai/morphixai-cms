function readPackage(pkg, context) {
  // 修复一些已知的依赖问题
  if (pkg.name === 'optimus-ui') {
    // 确保 React 版本兼容性
    pkg.peerDependencies = pkg.peerDependencies || {};
  }

  if (pkg.name === 'optimus-api') {
    // 修复 NestJS 相关依赖
    if (pkg.dependencies && pkg.dependencies['@nestjs/typeorm']) {
      pkg.dependencies['@nestjs/typeorm'] = '^7.1.5';
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};