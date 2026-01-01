/**
 * OSS 组件单元测试
 * 
 * 测试 transformOssUrl 和 transformOssHtml 函数
 */

import { transformOssUrl } from '../OssImage';
import { transformOssHtml } from '../RichTextContent';

// Mock 环境变量
const MOCK_CDN_PREFIX = 'https://cdn.example.com';

// 保存原始环境变量
const originalEnv = process.env.NEXT_PUBLIC_FILE_API_PREFIX;

describe('OSS Components', () => {
  beforeAll(() => {
    // 设置测试环境变量
    process.env.NEXT_PUBLIC_FILE_API_PREFIX = MOCK_CDN_PREFIX;
  });

  afterAll(() => {
    // 恢复原始环境变量
    process.env.NEXT_PUBLIC_FILE_API_PREFIX = originalEnv;
  });

  describe('transformOssUrl', () => {
    it('应该正确转换 OSS_FILE_PROXY 前缀', () => {
      const input = '/OSS_FILE_PROXY/images/logo.png';
      const expected = `${MOCK_CDN_PREFIX}/images/logo.png`;
      const result = transformOssUrl(input);
      expect(result).toBe(expected);
    });

    it('不应该转换普通 URL', () => {
      const input = 'https://example.com/image.jpg';
      const result = transformOssUrl(input);
      expect(result).toBe(input);
    });

    it('应该处理相对路径', () => {
      const input = '/images/local.png';
      const result = transformOssUrl(input);
      expect(result).toBe(input);
    });

    it('应该处理空字符串', () => {
      const result = transformOssUrl('');
      expect(result).toBe('');
    });

    it('应该处理多级路径', () => {
      const input = '/OSS_FILE_PROXY/folder/subfolder/image.jpg';
      const expected = `${MOCK_CDN_PREFIX}/folder/subfolder/image.jpg`;
      const result = transformOssUrl(input);
      expect(result).toBe(expected);
    });
  });

  describe('transformOssHtml', () => {
    it('应该转换 img src 中的 OSS_FILE_PROXY', () => {
      const input = '<img src="/OSS_FILE_PROXY/image.jpg" alt="Test" />';
      const expected = `<img src="${MOCK_CDN_PREFIX}/image.jpg" alt="Test" />`;
      const result = transformOssHtml(input);
      expect(result).toBe(expected);
    });

    it('应该转换 video src 中的 OSS_FILE_PROXY', () => {
      const input = '<video src="/OSS_FILE_PROXY/video.mp4" controls></video>';
      const expected = `<video src="${MOCK_CDN_PREFIX}/video.mp4" controls></video>`;
      const result = transformOssHtml(input);
      expect(result).toBe(expected);
    });

    it('应该转换 a href 中的 OSS_FILE_PROXY', () => {
      const input = '<a href="/OSS_FILE_PROXY/doc.pdf">下载</a>';
      const expected = `<a href="${MOCK_CDN_PREFIX}/doc.pdf">下载</a>`;
      const result = transformOssHtml(input);
      expect(result).toBe(expected);
    });

    it('应该转换 CSS url() 中的 OSS_FILE_PROXY', () => {
      const input = '<div style="background: url(\'/OSS_FILE_PROXY/bg.jpg\')"></div>';
      const expected = `<div style="background: url('${MOCK_CDN_PREFIX}/bg.jpg')"></div>`;
      const result = transformOssHtml(input);
      expect(result).toBe(expected);
    });

    it('应该转换多个 OSS_FILE_PROXY 路径', () => {
      const input = `
        <img src="/OSS_FILE_PROXY/img1.jpg" />
        <img src="/OSS_FILE_PROXY/img2.jpg" />
        <video src="/OSS_FILE_PROXY/video.mp4"></video>
      `;
      const result = transformOssHtml(input);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/img1.jpg`);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/img2.jpg`);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/video.mp4`);
    });

    it('当 transformAllUrls=false 时只转换图片', () => {
      const input = `
        <img src="/OSS_FILE_PROXY/img.jpg" />
        <a href="/OSS_FILE_PROXY/doc.pdf">下载</a>
      `;
      const result = transformOssHtml(input, false);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/img.jpg`);
      expect(result).toContain('/OSS_FILE_PROXY/doc.pdf');
    });

    it('不应该转换普通 URL', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Test" />';
      const result = transformOssHtml(input);
      expect(result).toBe(input);
    });

    it('应该处理空字符串', () => {
      const result = transformOssHtml('');
      expect(result).toBe('');
    });

    it('应该处理混合内容', () => {
      const input = `
        <div>
          <h1>标题</h1>
          <img src="/OSS_FILE_PROXY/header.jpg" alt="Header" />
          <p>这是一段文本</p>
          <img src="https://external.com/image.jpg" alt="External" />
          <video src="/OSS_FILE_PROXY/demo.mp4" controls></video>
        </div>
      `;
      const result = transformOssHtml(input);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/header.jpg`);
      expect(result).toContain(`${MOCK_CDN_PREFIX}/demo.mp4`);
      expect(result).toContain('https://external.com/image.jpg');
      expect(result).toContain('<h1>标题</h1>');
    });
  });

  describe('环境变量未配置时的处理', () => {
    it('transformOssUrl 应该返回原始路径', () => {
      const originalEnv = process.env.NEXT_PUBLIC_FILE_API_PREFIX;
      process.env.NEXT_PUBLIC_FILE_API_PREFIX = '';
      
      const input = '/OSS_FILE_PROXY/image.jpg';
      const result = transformOssUrl(input);
      expect(result).toBe('/OSS_FILE_PROXY/image.jpg');
      
      process.env.NEXT_PUBLIC_FILE_API_PREFIX = originalEnv;
    });

    it('transformOssHtml 应该返回原始 HTML', () => {
      const originalEnv = process.env.NEXT_PUBLIC_FILE_API_PREFIX;
      process.env.NEXT_PUBLIC_FILE_API_PREFIX = '';
      
      const input = '<img src="/OSS_FILE_PROXY/image.jpg" />';
      const result = transformOssHtml(input);
      expect(result).toBe(input);
      
      process.env.NEXT_PUBLIC_FILE_API_PREFIX = originalEnv;
    });
  });
});

/**
 * 集成测试示例
 * 
 * 这些测试需要在实际的 React 环境中运行
 */
export const integrationTestExamples = {
  // OssImage 组件测试
  ossImageTests: `
    import { render, screen, waitFor } from '@testing-library/react';
    import { OssImage } from '../OssImage';
    
    describe('OssImage Component', () => {
      it('应该渲染图片', () => {
        render(<OssImage src="/OSS_FILE_PROXY/test.jpg" alt="Test" />);
        const img = screen.getByAlt('Test');
        expect(img).toBeInTheDocument();
      });
      
      it('应该显示加载状态', () => {
        render(
          <OssImage 
            src="/OSS_FILE_PROXY/test.jpg" 
            alt="Test" 
            showLoading={true}
          />
        );
        // 检查加载 spinner 是否存在
        expect(screen.getByRole('img')).toHaveClass('opacity-0');
      });
      
      it('应该处理加载错误', async () => {
        const onError = jest.fn();
        render(
          <OssImage 
            src="/OSS_FILE_PROXY/invalid.jpg" 
            alt="Test"
            onError={onError}
            fallbackSrc="/placeholder.jpg"
          />
        );
        
        const img = screen.getByAlt('Test');
        fireEvent.error(img);
        
        await waitFor(() => {
          expect(img).toHaveAttribute('src', '/placeholder.jpg');
        });
      });
    });
  `,
  
  // RichTextContent 组件测试
  richTextTests: `
    import { render } from '@testing-library/react';
    import { RichTextContent } from '../RichTextContent';
    
    describe('RichTextContent Component', () => {
      it('应该渲染 HTML 内容', () => {
        const content = '<p>Hello World</p>';
        const { container } = render(<RichTextContent content={content} />);
        expect(container.querySelector('p')).toHaveTextContent('Hello World');
      });
      
      it('应该转换 OSS 路径', () => {
        const content = '<img src="/OSS_FILE_PROXY/test.jpg" />';
        const { container } = render(<RichTextContent content={content} />);
        const img = container.querySelector('img');
        expect(img?.src).toContain('cdn.example.com');
      });
      
      it('应该应用自定义类名', () => {
        const content = '<p>Test</p>';
        const { container } = render(
          <RichTextContent content={content} className="custom-class" />
        );
        expect(container.firstChild).toHaveClass('custom-class');
      });
    });
  `,
};

export default {
  displayName: 'OSS Components Tests',
  testEnvironment: 'node',
};



