import Link from 'next/link';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Container, Grid } from '../../design-system';

export default function PricingPage() {
  const pricingPlans = [
    {
      name: '开发者版',
      description: '适合个人开发者和小型项目',
      price: '免费',
      period: '',
      popular: false,
      features: [
        '每月 10,000 次 API 调用',
        '基础用户认证功能',
        '社区技术支持',
        '基础文档访问',
        '标准 SLA (99.5%)',
        '邮件支持'
      ],
      limitations: [
        '不包含高级功能',
        '有限的存储空间',
        '基础监控功能'
      ],
      cta: '立即开始',
      href: '/auth/register'
    },
    {
      name: '专业版',
      description: '适合中小企业和成长型团队',
      price: '¥299',
      period: '/月',
      popular: true,
      features: [
        '每月 100,000 次 API 调用',
        '完整用户管理系统',
        '优先技术支持',
        '完整文档和示例',
        '高级 SLA (99.9%)',
        '电话和邮件支持',
        '数据分析报告',
        '自定义集成',
        '团队协作功能'
      ],
      limitations: [],
      cta: '选择专业版',
      href: '/contact'
    },
    {
      name: '企业版',
      description: '适合大型企业和高并发场景',
      price: '¥999',
      period: '/月',
      popular: false,
      features: [
        '无限 API 调用',
        '企业级用户管理',
        '7x24 专属技术支持',
        '定制化开发支持',
        '企业级 SLA (99.99%)',
        '专属客户经理',
        '高级数据分析',
        '私有化部署选项',
        '定制化培训',
        '合规性支持',
        '多地域部署',
        '灾备方案'
      ],
      limitations: [],
      cta: '联系销售',
      href: '/contact'
    }
  ];

  const faqs = [
    {
      question: '可以随时升级或降级套餐吗？',
      answer: '是的，您可以随时升级或降级您的套餐。升级会立即生效，降级会在当前计费周期结束后生效。'
    },
    {
      question: '是否提供免费试用？',
      answer: '我们为专业版和企业版提供 30 天免费试用，无需信用卡。试用期间您可以体验所有功能。'
    },
    {
      question: '如何计算 API 调用次数？',
      answer: 'API 调用次数按照实际请求计算，包括成功和失败的请求。我们提供详细的使用统计报告。'
    },
    {
      question: '是否支持私有化部署？',
      answer: '企业版支持私有化部署，我们的技术团队会协助您完成部署和配置工作。'
    },
    {
      question: '退款政策是什么？',
      answer: '我们提供 30 天无条件退款保证。如果您不满意我们的服务，可以申请全额退款。'
    },
    {
      question: '技术支持包含哪些内容？',
      answer: '技术支持包括 API 集成指导、问题排查、最佳实践建议等。企业版客户享有专属技术支持。'
    }
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-20 lg:py-28">
        <div className="absolute inset-0 bg-grid-neutral-100/50 dark:bg-grid-neutral-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
        
        <Container className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              简单透明的
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                定价方案
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              选择适合您业务需求的方案，从免费的开发者版到企业级解决方案，
              我们为不同规模的团队提供灵活的定价选项。
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30 天免费试用
              </div>
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                无需信用卡
              </div>
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                随时取消
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 lg:py-28">
        <Container>
          <Grid cols={{ sm: 1, lg: 3 }} gap="2rem">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                variant={plan.popular ? "elevated" : "default"}
                className={`relative ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-1 text-sm font-medium text-white">
                      最受欢迎
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  {/* Plan Header */}
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    <p className="mt-2 text-muted-foreground">{plan.description}</p>
                    <div className="mt-6">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="mb-4 font-semibold text-foreground">包含功能</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <svg className="mt-0.5 h-4 w-4 text-success-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="mb-8">
                      <h4 className="mb-4 font-semibold text-foreground">限制</h4>
                      <ul className="space-y-3">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <svg className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link href={plan.href}>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "primary" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </Grid>

          {/* Enterprise Contact */}
          <div className="mt-16 text-center">
            <Card variant="filled" className="mx-auto max-w-2xl">
              <div className="p-8">
                <h3 className="mb-4 text-2xl font-bold text-foreground">需要定制方案？</h3>
                <p className="mb-6 text-muted-foreground">
                  如果您有特殊需求或需要更大规模的解决方案，我们的销售团队将为您提供定制化的企业方案。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button>联系销售团队</Button>
                  </Link>
                  <Link href="/docs/enterprise">
                    <Button variant="outline">了解企业方案</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                常见问题
              </h2>
              <p className="text-lg text-muted-foreground">
                关于定价和服务的常见问题解答
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} variant="default">
                  <div className="p-6">
                    <h3 className="mb-3 text-lg font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="mb-4 text-muted-foreground">
                还有其他问题？
              </p>
              <Link href="/contact">
                <Button variant="outline">联系我们</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}