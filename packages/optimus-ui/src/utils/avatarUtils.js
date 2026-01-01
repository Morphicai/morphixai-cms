/**
 * 头像文字处理工具
 * 根据语言类型智能截取显示文字
 */

/**
 * 获取头像显示文字
 * 中文：显示最后一个字
 * 英文：显示第一个单词的首字母（大写）
 * @param {string} name - 用户名称
 * @returns {string} 处理后的显示文字
 */
export const getAvatarText = (name) => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return '';
  }

  // 检查是否包含中文
  const hasChinese = /[\u4e00-\u9fa5]/.test(trimmedName);
  
  if (hasChinese) {
    // 中文名：取最后一个字
    return trimmedName.charAt(trimmedName.length - 1);
  } else {
    // 英文名：取第一个单词的首字母并大写
    const firstWord = trimmedName.split(/\s+/)[0];
    return firstWord.charAt(0).toUpperCase();
  }
};

/**
 * 获取头像背景色（基于名称生成一致的颜色）
 * @param {string} name - 用户名称
 * @returns {string} 颜色值
 */
export const getAvatarColor = (name) => {
  const colors = [
    '#6C5CE7', // 主色紫
    '#00B894', // 成功绿
    '#74B9FF', // 信息蓝
    '#FDCB6E', // 警告黄
    '#A29BFE', // 浅紫
    '#55EFC4', // 浅绿
  ];
  
  if (!name) {
    return colors[0];
  }
  
  // 基于名称生成一致的索引
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
