'use client'

import { useState } from 'react'
import Button from '@/components/Button'
import Card from '@/components/Card'

export default function ComponentsPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          组件展示
        </h1>

        {/* Button 组件展示 */}
        <Card title="Button 按钮组件" className="mb-8">
          <div className="space-y-6">
            {/* 不同变体 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                变体 (Variants)
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* 不同尺寸 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                尺寸 (Sizes)
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* 禁用状态 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                禁用状态 (Disabled)
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" disabled>
                  Disabled Primary
                </Button>
                <Button variant="secondary" disabled>
                  Disabled Secondary
                </Button>
              </div>
            </div>

            {/* 交互示例 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                交互示例
              </h4>
              <div className="flex items-center gap-4">
                <Button onClick={() => setCount(count - 1)} variant="outline">
                  -
                </Button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {count}
                </span>
                <Button onClick={() => setCount(count + 1)} variant="primary">
                  +
                </Button>
                <Button onClick={() => setCount(0)} variant="secondary">
                  重置
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 组件展示 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card title="基础 Card">
            <p className="text-gray-600 dark:text-gray-400">
              这是一个基础的 Card 组件，带有标题和内容区域。
            </p>
          </Card>

          <Card title="带底部的 Card" footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm">取消</Button>
              <Button variant="primary" size="sm">确认</Button>
            </div>
          }>
            <p className="text-gray-600 dark:text-gray-400">
              这个 Card 组件包含了一个 footer 区域，可以放置操作按钮。
            </p>
          </Card>
        </div>

        {/* 代码示例 */}
        <Card title="使用示例">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Button 组件
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import Button from '@/components/Button'

<Button variant="primary" size="default" onClick={() => console.log('clicked')}>
  点击我
</Button>`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Card 组件
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import Card from '@/components/Card'

<Card title="标题" footer={<div>底部内容</div>}>
  <p>卡片内容</p>
</Card>`}</code>
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

