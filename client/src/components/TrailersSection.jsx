import { useState, useEffect } from 'react'
import { dummyTrailers } from '../assets/assets'
import ReactPlayer from 'react-player'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const TrailersSection = () => {
    const { axios } = useAppContext()
    const [trailers, setTrailers] = useState(dummyTrailers)
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])
    const [isPlaying, setIsPlaying] = useState(false)

    // Carousel state for > 4 trailers
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [itemsPerView, setItemsPerView] = useState(4)

    useEffect(() => {
        let isMounted = true
        const fetchTrailers = async () => {
            try {
                const { data } = await axios.get('/api/show/trailers')
                if (isMounted && data?.success && data.trailers?.length > 0) {
                    setTrailers(data.trailers)
                    setCurrentTrailer(data.trailers[0])
                }
            } catch (error) {
                console.error('Failed to load now showing trailers:', error)
            }
        }
        fetchTrailers()
        return () => {
            isMounted = false
        }
    }, [axios])

    // Responsive items per view
    useEffect(() => {
        const updateItems = () => {
            if (window.innerWidth < 640) {
                setItemsPerView(2)
            } else if (window.innerWidth < 1024) {
                setItemsPerView(3)
            } else {
                setItemsPerView(4)
            }
        }
        updateItems()
        window.addEventListener('resize', updateItems)
        return () => window.removeEventListener('resize', updateItems)
    }, [])

    const isSlideshow = trailers.length > 4

    // Clone leading items to allow seamless infinite wrap
    const extendedTrailers = isSlideshow
        ? [...trailers, ...trailers.slice(0, itemsPerView)]
        : trailers

    const nextSlide = () => {
        if (!isSlideshow) return
        setIsTransitioning(true)
        setCurrentIndex((prev) => prev + 1)
    }

    const prevSlide = () => {
        if (!isSlideshow) return
        setIsTransitioning(true)
        setCurrentIndex((prev) => (prev === 0 ? trailers.length - 1 : prev - 1))
    }

    const handleTransitionEnd = () => {
        if (currentIndex >= trailers.length) {
            setIsTransitioning(false)
            setCurrentIndex(0)
        }
    }

    // Auto-advance rotating slide show from right to left every 3.5s
    useEffect(() => {
        if (!isSlideshow || isPaused) return

        const timer = setInterval(() => {
            nextSlide()
        }, 3500)

        return () => clearInterval(timer)
    }, [isSlideshow, isPaused, trailers.length])

    const handleTrailerSelect = (trailer) => {
        setCurrentTrailer(trailer)
        setIsPlaying(true)
    }

    const renderTrailerCard = (trailer, uniqueKey) => {
        const isSelected = currentTrailer?.videoUrl === trailer.videoUrl
        return (
            <button
                key={uniqueKey}
                type='button'
                aria-label={`Play trailer for ${trailer.title || 'movie'}`}
                aria-pressed={isSelected}
                className={`relative group/card w-full h-44 sm:h-52 md:h-56 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                    isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-gray-900 brightness-105'
                        : 'opacity-75 hover:opacity-100'
                }`}
                onClick={() => handleTrailerSelect(trailer)}
            >
                <img
                    src={trailer.image}
                    alt={trailer.title || 'trailer'}
                    className='rounded-lg w-full h-full object-cover brightness-90 group-hover/card:brightness-100 transition duration-300'
                    onError={(e) => {
                        if (trailer.fallbackImage && e.currentTarget.src !== trailer.fallbackImage) {
                            e.currentTarget.src = trailer.fallbackImage
                        }
                    }}
                />
                <PlayCircleIcon
                    strokeWidth={1.6}
                    className='absolute top-1/2 left-1/2 w-6 md:w-10 h-6 md:h-10 transform -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md group-hover/card:scale-110 transition duration-300'
                />
                {trailer.title && (
                    <div className='absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent'>
                        <p className='text-xs md:text-sm font-medium text-white truncate text-center'>
                            {trailer.title}
                        </p>
                    </div>
                )}
            </button>
        )
    }

    return (
        <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
            <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>
            <div className='relative mt-6 aspect-video max-w-[960px] mx-auto'>
                <BlurCircle top='-100px' right='-100px' />
                <ReactPlayer
                    key={currentTrailer?.videoUrl}
                    src={currentTrailer?.videoUrl}
                    controls
                    playing={isPlaying}
                    width='100%'
                    height='100%'
                    className='relative z-10'
                />
            </div>

            {/* Static Grid when 4 or fewer trailers */}
            {!isSlideshow ? (
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'>
                    {trailers.map((trailer, idx) =>
                        renderTrailerCard(trailer, `${trailer.videoUrl || trailer.image}-${idx}`)
                    )}
                </div>
            ) : (
                /* Rotating Slideshow from right to left when > 4 trailers */
                <div
                    className='relative mt-8 max-w-4xl mx-auto group'
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Navigation buttons */}
                    <button
                        type='button'
                        onClick={prevSlide}
                        aria-label='Previous trailers'
                        className='absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 bg-gray-900/80 hover:bg-gray-800 p-2 rounded-full text-white/90 hover:text-white transition shadow-lg cursor-pointer border border-gray-700'
                    >
                        <ChevronLeft className='w-5 h-5 md:w-6 md:h-6' />
                    </button>
                    <button
                        type='button'
                        onClick={nextSlide}
                        aria-label='Next trailers'
                        className='absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 bg-gray-900/80 hover:bg-gray-800 p-2 rounded-full text-white/90 hover:text-white transition shadow-lg cursor-pointer border border-gray-700'
                    >
                        <ChevronRight className='w-5 h-5 md:w-6 md:h-6' />
                    </button>

                    {/* Slideshow viewport & track */}
                    <div className='overflow-hidden rounded-xl py-2'>
                        <div
                            className='flex'
                            style={{
                                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                                transition: isTransitioning ? 'transform 500ms ease-in-out' : 'none',
                            }}
                            onTransitionEnd={handleTransitionEnd}
                        >
                            {extendedTrailers.map((trailer, idx) => (
                                <div
                                    key={`${trailer.videoUrl || trailer.image}-${idx}`}
                                    className='shrink-0 px-2'
                                    style={{ width: `${100 / itemsPerView}%` }}
                                >
                                    {renderTrailerCard(trailer, `${trailer.videoUrl || trailer.image}-${idx}`)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TrailersSection