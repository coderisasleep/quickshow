import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { dummyTrailers } from '../assets/assets'
import ReactPlayer from 'react-player'
import BlurCircle from './BlurCircle'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const TrailersSection = () => {
    const { axios } = useAppContext()
    const location = useLocation()
    const trailersSectionRef = useRef(null)

    const [trailers, setTrailers] = useState(dummyTrailers)
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])
    const [isPlaying, setIsPlaying] = useState(false)

    // Carousel state for > 4 trailers
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [itemsPerView, setItemsPerView] = useState(4)

    // Unified trailer loading and selection
    useEffect(() => {
        let isMounted = true
        const targetMovieId = location.state?.trailerMovieId

        const loadTrailers = async () => {
            try {
                const { data } = await axios.get('/api/show/trailers')
                if (!isMounted) return

                let loadedTrailers = data?.success && data.trailers?.length > 0
                    ? data.trailers
                    : dummyTrailers

                if (targetMovieId) {
                    let targetTrailer = loadedTrailers.find(
                        (t) => t.movieId?.toString() === targetMovieId.toString()
                    )

                    if (!targetTrailer) {
                        try {
                            const { data: singleData } = await axios.get(`/api/show/trailer/${targetMovieId}`)
                            if (isMounted && singleData?.success && singleData.trailer) {
                                targetTrailer = singleData.trailer
                                loadedTrailers = [
                                    targetTrailer,
                                    ...loadedTrailers.filter((t) => t.movieId?.toString() !== targetMovieId.toString()),
                                ]
                            }
                        } catch (singleErr) {
                            console.error('Error fetching trailer for movie:', targetMovieId, singleErr)
                        }
                    }

                    if (isMounted) {
                        setTrailers(loadedTrailers)
                        if (targetTrailer) {
                            setCurrentTrailer(targetTrailer)
                            setIsPlaying(true)
                            setTimeout(() => {
                                trailersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }, 200)
                        } else {
                            setCurrentTrailer(loadedTrailers[0])
                        }
                    }
                } else {
                    if (isMounted) {
                        setTrailers(loadedTrailers)
                        setCurrentTrailer(loadedTrailers[0])
                    }
                }
            } catch (error) {
                console.error('Failed to load trailers:', error)
            }
        }

        loadTrailers()

        return () => {
            isMounted = false
        }
    }, [axios, location.key])

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
        if (!isSlideshow || isPaused || isPlaying) return

        const timer = setInterval(() => {
            nextSlide()
        }, 3500)

        return () => clearInterval(timer)
    }, [isSlideshow, isPaused, isPlaying, trailers.length])

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
                className={`relative group/card w-full aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                    isSelected
                        ? 'border-2 border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/20 brightness-105'
                        : 'border border-white/10 opacity-75 hover:opacity-100 hover:border-white/30'
                }`}
                onClick={() => handleTrailerSelect(trailer)}
            >
                <img
                    src={trailer.image}
                    alt={trailer.title || 'trailer'}
                    className='w-full h-full object-cover brightness-85 group-hover/card:brightness-100 transition duration-300'
                    onError={(e) => {
                        if (trailer.fallbackImage && e.currentTarget.src !== trailer.fallbackImage) {
                            e.currentTarget.src = trailer.fallbackImage
                        }
                    }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-2.5'>
                    <div className='flex justify-end'>
                        {isSelected && (
                            <span className='bg-primary/95 text-[10px] font-semibold text-white px-2 py-0.5 rounded shadow-sm'>
                                ACTIVE
                            </span>
                        )}
                    </div>
                    <div className='flex items-center gap-2'>
                        <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-300 group-hover/card:scale-110 ${
                                isSelected ? 'bg-primary' : 'bg-white/20 backdrop-blur-sm'
                            }`}
                        >
                            <Play className='w-2.5 h-2.5 fill-white ml-0.5' />
                        </div>
                        {trailer.title && (
                            <p className='text-xs font-medium text-white truncate text-left'>
                                {trailer.title}
                            </p>
                        )}
                    </div>
                </div>
            </button>
        )
    }

    return (
        <div id='trailers-section' ref={trailersSectionRef} className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
            <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>

            {/* Main Video Player with Rounded Corners */}
            <div className='relative mt-6 aspect-video max-w-[960px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-black border border-gray-800/60'>
                <BlurCircle top='-100px' right='-100px' />
                <ReactPlayer
                    key={currentTrailer?.videoUrl}
                    src={currentTrailer?.videoUrl}
                    controls
                    playing={isPlaying}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    width='100%'
                    height='100%'
                    className='relative z-10'
                />
            </div>

            {/* Static Grid when 4 or fewer trailers */}
            {!isSlideshow ? (
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mt-8 max-w-3xl mx-auto'>
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
                        className='absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-black p-2 rounded-full text-white/90 hover:text-white transition shadow-lg cursor-pointer border border-gray-700/80'
                    >
                        <ChevronLeft className='w-5 h-5 md:w-6 md:h-6' />
                    </button>
                    <button
                        type='button'
                        onClick={nextSlide}
                        aria-label='Next trailers'
                        className='absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-black p-2 rounded-full text-white/90 hover:text-white transition shadow-lg cursor-pointer border border-gray-700/80'
                    >
                        <ChevronRight className='w-5 h-5 md:w-6 md:h-6' />
                    </button>

                    {/* Slideshow viewport & track */}
                    <div className='overflow-hidden rounded-xl py-2 px-1'>
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