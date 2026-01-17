'use client'

interface CategoryHeroProps {
  title: string
  subtitle?: string
  productCount: number
  startingPrice?: number
  bannerImage?: string
}

export function CategoryHero({
  title,
  subtitle,
  productCount,
  startingPrice,
  bannerImage
}: CategoryHeroProps) {
  return (
    <div className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg overflow-hidden mb-8">
      {bannerImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
      )}
      <div className="relative px-6 py-12 md:px-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-purple-100 mb-4">{subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
          <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            {productCount.toLocaleString()} {productCount === 1 ? 'resource' : 'resources'}
          </span>
          {startingPrice && (
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              Starting at ₱{startingPrice.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
