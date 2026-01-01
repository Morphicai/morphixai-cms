'use client';

import { Container, Grid, Flex, ThemeToggle, useTheme, useBreakpoint } from '../../design-system';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Section, Stack, VStack, HStack, Spacer, Divider, AspectRatio } from '../../components/layout';

export default function DesignSystemDemo() {
  const { theme, resolvedTheme, tokens } = useTheme();
  const breakpoint = useBreakpoint();

  return (
    <div className="min-h-screen py-8">
      <Container>
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Optimus 设计系统演示
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              展示设计令牌、主题切换和响应式网格系统的完整功能
            </p>
            <div className="mt-6 flex justify-center items-center gap-4">
              <span className="text-sm text-muted-foreground">
                当前主题: {theme} ({resolvedTheme}) | 断点: {breakpoint}
              </span>
              <ThemeToggle />
            </div>
          </div>

          {/* Color Palette */}
          <Card title="颜色系统" variant="elevated">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">主要颜色</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(tokens.colors.primary).map(([shade, color]) => (
                    <div key={shade} className="text-center">
                      <div
                        className="w-full h-12 rounded-md border border-border mb-2"
                        style={{ backgroundColor: color }}
                      />
                      <div className="text-xs">
                        <div className="font-medium">{shade}</div>
                        <div className="text-muted-foreground">{color}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">语义化颜色</h4>
                <Grid cols={{ sm: 2, md: 4 }} gap="1rem">
                  {Object.entries(tokens.colors.semantic).map(([name, colors]) => (
                    <div key={name} className="text-center">
                      <div
                        className="w-full h-12 rounded-md border border-border mb-2"
                        style={{ backgroundColor: colors[500] }}
                      />
                      <div className="text-xs">
                        <div className="font-medium capitalize">{name}</div>
                        <div className="text-muted-foreground">{colors[500]}</div>
                      </div>
                    </div>
                  ))}
                </Grid>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card title="字体系统" variant="elevated">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">字体大小</h4>
                <div className="space-y-2">
                  {Object.entries(tokens.typography.fontSize).map(([size, value]) => (
                    <div key={size} className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-12">{size}</span>
                      <span className="text-xs text-muted-foreground w-16">{value}</span>
                      <span style={{ fontSize: value }}>
                        示例文本 Sample Text
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <Card title="按钮组件" variant="elevated">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">按钮变体</h4>
                <Flex gap="1rem" wrap="wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </Flex>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">按钮尺寸</h4>
                <Flex gap="1rem" align="center" wrap="wrap">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Button>
                </Flex>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">按钮状态</h4>
                <Flex gap="1rem" wrap="wrap">
                  <Button>Normal</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </Flex>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">带图标的按钮</h4>
                <Flex gap="1rem" wrap="wrap">
                  <Button 
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    Left Icon
                  </Button>
                  <Button 
                    rightIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    Right Icon
                  </Button>
                  <Button 
                    variant="outline"
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    }
                  >
                    Download
                  </Button>
                </Flex>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">全宽按钮</h4>
                <Button fullWidth>Full Width Button</Button>
              </div>
            </div>
          </Card>

          {/* Cards */}
          <Card title="卡片组件" variant="elevated">
            <Grid cols={{ sm: 1, md: 3 }} gap="1.5rem">
              <Card variant="default" title="Default Card" description="这是一个默认样式的卡片组件">
                <p className="text-muted-foreground">
                  使用边框样式，适合大多数场景。
                </p>
              </Card>
              
              <Card variant="elevated" title="Elevated Card" description="带阴影的立体卡片">
                <p className="text-muted-foreground">
                  提供立体感，突出重要内容。
                </p>
              </Card>
              
              <Card 
                variant="outlined" 
                title="Outlined Card"
                description="粗边框样式"
                footer={
                  <Button size="sm" variant="outline">
                    Action
                  </Button>
                }
              >
                <p className="text-muted-foreground">
                  强调边界，包含页脚操作。
                </p>
              </Card>

              <Card variant="ghost" title="Ghost Card" description="透明背景">
                <p className="text-muted-foreground">
                  最小化设计，融入背景。
                </p>
              </Card>

              <Card variant="filled" title="Filled Card" description="填充背景">
                <p className="text-muted-foreground">
                  有背景色，区分内容区域。
                </p>
              </Card>

              <Card hoverable clickable title="Interactive Card" description="可交互卡片">
                <p className="text-muted-foreground">
                  支持悬停和点击效果。
                </p>
              </Card>
            </Grid>
          </Card>

          {/* Grid System */}
          <Card title="网格系统" variant="elevated">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">响应式网格</h4>
                <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap="1rem">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-primary-100 dark:bg-primary-900 p-4 rounded-md text-center text-primary-600 dark:text-primary-400"
                    >
                      Grid Item {i + 1}
                    </div>
                  ))}
                </Grid>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Flexbox 布局</h4>
                <Flex direction="row" justify="between" align="center" gap="1rem" className="bg-muted p-4 rounded-md">
                  <div className="bg-primary-500 text-white p-2 rounded">Start</div>
                  <div className="bg-secondary-500 text-white p-2 rounded">Center</div>
                  <div className="bg-accent-500 text-white p-2 rounded">End</div>
                </Flex>
              </div>
            </div>
          </Card>

          {/* Spacing */}
          <Card title="间距系统" variant="elevated">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">间距示例</h4>
              <div className="space-y-2">
                {['1', '2', '4', '6', '8', '12', '16'].map((space) => (
                  <div key={space} className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-8">{space}</span>
                    <span className="text-xs text-muted-foreground w-16">
                      {tokens.spacing[space]}
                    </span>
                    <div
                      className="bg-primary-500 h-4"
                      style={{ width: tokens.spacing[space] }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Layout Components */}
          <Card title="布局组件" variant="elevated">
            <div className="space-y-8">
              {/* Stack 组件 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Stack 组件</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">垂直堆叠 (VStack)</p>
                    <VStack spacing="md" className="bg-muted p-4 rounded-md">
                      <div className="bg-primary-500 text-white p-2 rounded text-center">Item 1</div>
                      <div className="bg-secondary-500 text-white p-2 rounded text-center">Item 2</div>
                      <div className="bg-accent-500 text-white p-2 rounded text-center">Item 3</div>
                    </VStack>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">水平堆叠 (HStack)</p>
                    <HStack spacing="md" className="bg-muted p-4 rounded-md">
                      <div className="bg-primary-500 text-white p-2 rounded text-center">Item 1</div>
                      <div className="bg-secondary-500 text-white p-2 rounded text-center">Item 2</div>
                      <div className="bg-accent-500 text-white p-2 rounded text-center">Item 3</div>
                    </HStack>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">带分隔符的堆叠</p>
                    <HStack 
                      divider={<Divider orientation="vertical" spacing="none" className="h-6" />}
                      className="bg-muted p-4 rounded-md"
                    >
                      <div className="bg-primary-500 text-white p-2 rounded text-center">Item 1</div>
                      <div className="bg-secondary-500 text-white p-2 rounded text-center">Item 2</div>
                      <div className="bg-accent-500 text-white p-2 rounded text-center">Item 3</div>
                    </HStack>
                  </div>
                </div>
              </div>

              {/* Divider 组件 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">分隔符组件</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">基础分隔符</p>
                    <div>
                      <p>上方内容</p>
                      <Divider />
                      <p>下方内容</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">带标签的分隔符</p>
                    <div>
                      <p>上方内容</p>
                      <Divider label="或者" />
                      <p>下方内容</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">不同样式</p>
                    <div className="space-y-2">
                      <Divider variant="solid" label="实线" />
                      <Divider variant="dashed" label="虚线" />
                      <Divider variant="dotted" label="点线" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AspectRatio 组件 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">宽高比组件</h4>
                <Grid cols={{ sm: 1, md: 3 }} gap="1rem">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">1:1 正方形</p>
                    <AspectRatio preset="1:1" className="bg-gradient-to-br from-primary-400 to-primary-600 rounded-md">
                      <div className="flex items-center justify-center text-white font-medium">
                        1:1
                      </div>
                    </AspectRatio>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">16:9 视频</p>
                    <AspectRatio preset="16:9" className="bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-md">
                      <div className="flex items-center justify-center text-white font-medium">
                        16:9
                      </div>
                    </AspectRatio>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">4:3 传统</p>
                    <AspectRatio preset="4:3" className="bg-gradient-to-br from-accent-400 to-accent-600 rounded-md">
                      <div className="flex items-center justify-center text-white font-medium">
                        4:3
                      </div>
                    </AspectRatio>
                  </div>
                </Grid>
              </div>

              {/* Spacer 组件 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">间距组件</h4>
                <div className="bg-muted p-4 rounded-md">
                  <div className="bg-primary-500 text-white p-2 rounded text-center">上方内容</div>
                  <Spacer size="lg" />
                  <div className="bg-secondary-500 text-white p-2 rounded text-center">下方内容</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Shadows */}
          <Card title="阴影系统" variant="elevated">
            <Grid cols={{ sm: 2, md: 4 }} gap="2rem">
              {Object.entries(tokens.shadows).slice(0, 6).map(([name, shadow]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-full h-16 bg-card rounded-md mb-2"
                    style={{ boxShadow: shadow }}
                  />
                  <div className="text-xs">
                    <div className="font-medium">{name}</div>
                  </div>
                </div>
              ))}
            </Grid>
          </Card>
        </div>
      </Container>
    </div>
  );
}