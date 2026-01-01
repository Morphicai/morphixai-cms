import React from 'react';
import { Avatar as AntAvatar } from 'antd';
import { getAvatarText } from '../../utils/avatarUtils';

/**
 * 自定义头像组件
 * 自动处理中英文名称显示
 */
const Avatar = ({ name, src, size = 40, style, ...props }) => {
  const displayText = getAvatarText(name);

  return (
    <AntAvatar
      src={src}
      size={size}
      style={style}
      {...props}
    >
      {!src && displayText}
    </AntAvatar>
  );
};

export default Avatar;
