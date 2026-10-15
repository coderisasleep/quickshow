const timeFormat = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const minutesRemainder = Math.floor(minutes % 60)

    return `${hours}h ${minutesRemainder}m`
}

export default timeFormat
