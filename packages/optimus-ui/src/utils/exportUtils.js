import dayjs from 'dayjs';

/**
 * 将数据导出为 CSV 文件
 * @param {Array} data - 要导出的数据数组
 * @param {string} filename - 导出的文件名
 */
export function exportToCSV(data, filename) {
  // CSV 表头
  const headers = [
    '日志ID',
    '操作时间',
    '用户ID',
    '模块',
    '操作',
    '描述',
    '状态',
    '耗时(ms)',
    'IP地址',
    '请求方法',
    '请求路径',
  ];

  // 转换数据为 CSV 行
  const rows = data.map((log) => [
    log.id || '',
    log.createDate ? dayjs(log.createDate).format('YYYY-MM-DD HH:mm:ss') : '',
    log.userId || '',
    log.module || '',
    log.action || '',
    log.description || '',
    log.status || '',
    log.duration || '',
    log.ip || '',
    log.method || '',
    log.path || '',
  ]);

  // 组合 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // 处理包含逗号、引号或换行符的单元格
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  // 创建 Blob 并下载（添加 BOM 头支持中文）
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放 URL 对象
  URL.revokeObjectURL(url);
}

/**
 * 下载Excel文件（Blob格式）
 * @param {Blob} blob - Excel文件的Blob对象
 * @param {string} filename - 导出的文件名
 */
export function downloadExcel(blob, filename) {
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 释放 URL 对象
  URL.revokeObjectURL(url);
}
