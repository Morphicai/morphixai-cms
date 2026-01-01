/**
 * ProTable 迁移验证脚本
 * 用于验证所有文章管理页面是否正确使用 ProTable
 */

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  {
    file: 'index.jsx',
    shouldContain: 'ArticleListPro',
    shouldNotContain: 'import ArticleList from',
    description: '全部文章管理'
  },
  {
    file: 'views/CategoryArticles.jsx',
    shouldContain: 'ArticleListPro',
    shouldNotContain: 'import ArticleList from',
    description: '分类专属文章管理'
  }
];

console.log('🔍 开始验证 ProTable 迁移...\n');

let allPassed = true;

filesToCheck.forEach(({ file, shouldContain, shouldNotContain, description }) => {
  const filePath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const hasRequired = content.includes(shouldContain);
    const hasOld = shouldNotContain && content.includes(shouldNotContain);
    
    if (hasRequired && !hasOld) {
      console.log(`✅ ${description} (${file})`);
      console.log(`   - 正确使用 ${shouldContain}\n`);
    } else {
      allPassed = false;
      console.log(`❌ ${description} (${file})`);
      if (!hasRequired) {
        console.log(`   - 缺少: ${shouldContain}`);
      }
      if (hasOld) {
        console.log(`   - 仍在使用旧版: ${shouldNotContain}`);
      }
      console.log('');
    }
  } catch (error) {
    allPassed = false;
    console.log(`❌ ${description} (${file})`);
    console.log(`   - 文件读取失败: ${error.message}\n`);
  }
});

// 检查路由配置
const routesPath = path.join(__dirname, '../../constants/routes.js');
try {
  const routesContent = fs.readFileSync(routesPath, 'utf-8');
  if (routesContent.includes('ArticleListPro')) {
    console.log('✅ 路由配置已更新\n');
  } else {
    allPassed = false;
    console.log('❌ 路由配置未更新\n');
  }
} catch (error) {
  console.log(`⚠️  无法检查路由配置: ${error.message}\n`);
}

// 检查 ProTable 组件是否存在
const proTablePath = path.join(__dirname, 'components/ArticleProTable.jsx');
const proListPath = path.join(__dirname, 'views/ArticleListPro.jsx');

if (fs.existsSync(proTablePath)) {
  console.log('✅ ArticleProTable 组件存在');
} else {
  allPassed = false;
  console.log('❌ ArticleProTable 组件不存在');
}

if (fs.existsSync(proListPath)) {
  console.log('✅ ArticleListPro 组件存在');
} else {
  allPassed = false;
  console.log('❌ ArticleListPro 组件不存在');
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ 所有检查通过！ProTable 迁移成功！');
} else {
  console.log('❌ 部分检查失败，请检查上述错误');
  process.exit(1);
}
console.log('='.repeat(50) + '\n');
