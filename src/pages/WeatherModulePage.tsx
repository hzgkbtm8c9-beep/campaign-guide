import {
  useEffect,
  useState,
} from 'react'

import type {
  Campaign,
  CharacterModule,
} from '../data/database'

import {
  getOrCreateCharacter,
  getWeatherModule,
  getOrCreateWeatherModuleData,
  updateWeatherModuleData,
} from '../data/repository'

import {
  SaveStatus,
  type SaveStatusState,
} from '../components/SaveStatus'

import GuideHelpButton from '../components/GuideHelpButton'
import CharacterModuleActions from '../components/CharacterModuleActions'

type Season =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'

type WeatherTone =
  | 'rich-blue'
  | 'deep-cool'
  | 'cool'
  | 'pale-cool'
  | 'light-blue'
  | 'neutral'
  | 'mild'
  | 'warm'
  | 'hot'

type WeatherHexData = {
  id: string
  label: string
  column: number
  row: number
  tone: WeatherTone
  severity?: 'hindering'
  startingRoll?: number | number[]
}

const seasons: {
  id: Season
  label: string
}[] = [
  {
    id: 'spring',
    label: 'Spring',
  },
  {
    id: 'summer',
    label: 'Summer',
  },
  {
    id: 'autumn',
    label: 'Autumn',
  },
  {
    id: 'winter',
    label: 'Winter',
  },
]

const springHexes: WeatherHexData[] = [
  {
    id: 'heavy-rainfall',
    label: 'Heavy\nRainfall',
    column: 3,
    row: 1,
    tone: 'deep-cool',
    severity: 'hindering',
  },

  {
    id: 'short-showers',
    label: 'Short\nShowers',
    column: 2,
    row: 2,
    tone: 'cool',
    startingRoll: 3,
  },
  {
    id: 'snowy-rain',
    label: 'Snowy\nRain',
    column: 4,
    row: 2,
    tone: 'cool',
    severity: 'hindering',
  },

  {
    id: 'warm-drizzle',
    label: 'Warm\nDrizzle',
    column: 1,
    row: 3,
    tone: 'neutral',
  },
  {
    id: 'sleet',
    label: 'Sleet',
    column: 3,
    row: 3,
    tone: 'cool',
  },
  {
    id: 'windy-snowy',
    label: 'Windy &\nSnowy',
    column: 5,
    row: 3,
    tone: 'pale-cool',
    startingRoll: 2,
  },

  {
    id: 'nippy-humid',
    label: 'Nippy\n& Humid',
    column: 2,
    row: 4,
    tone: 'neutral',
    startingRoll: 12,
  },
  {
    id: 'hail',
    label: 'Hail',
    column: 4,
    row: 4,
    tone: 'pale-cool',
    severity: 'hindering',
  },

  {
    id: 'warm-humid',
    label: 'Warm &\nHumid',
    column: 1,
    row: 5,
    tone: 'mild',
    startingRoll: 11,
  },
  {
    id: 'clear-nippy',
    label: 'Clear\n& Nippy',
    column: 3,
    row: 5,
    tone: 'neutral',
    startingRoll: 5,
  },
  {
    id: 'heavy-snowfall',
    label: 'Heavy\nSnowfall',
    column: 5,
    row: 5,
    tone: 'light-blue',
    severity: 'hindering',
    startingRoll: 4,
  },

  {
    id: 'cloudy-warm',
    label: 'Cloudy\n& Warm',
    column: 2,
    row: 6,
    tone: 'mild',
    startingRoll: 10,
  },
  {
    id: 'cold-wafts-mist',
    label: 'Cold Wafts\nof Mist',
    column: 4,
    row: 6,
    tone: 'pale-cool',
    startingRoll: 6,
  },

  {
    id: 'hot-dry',
    label: 'Hot &\nDry',
    column: 1,
    row: 7,
    tone: 'hot',
    severity: 'hindering',
  },
  {
    id: 'sunny-clear',
    label: 'Sunny &\nClear',
    column: 3,
    row: 7,
    tone: 'neutral',
    startingRoll: 9,
  },
  {
    id: 'light-snowfall',
    label: 'Light\nSnowfall',
    column: 5,
    row: 7,
    tone: 'pale-cool',
    severity: 'hindering',
    startingRoll: 7,
  },

  {
    id: 'strong-pollen-drift',
    label: 'Strong\nPollen Drift',
    column: 2,
    row: 8,
    tone: 'mild',
    severity: 'hindering',
  },
  {
    id: 'coldy-dry',
    label: 'Coldy\n& Dry',
    column: 4,
    row: 8,
    tone: 'neutral',
    startingRoll: 8,
  },

  {
    id: 'pleasantly-warm',
    label: 'Pleasantly\nWarm',
    column: 3,
    row: 9,
    tone: 'mild',
  },
]

const summerHexes: WeatherHexData[] = [
  {
    id: 'torrential-rain',
    label: 'Torrential\nRain',
    column: 3,
    row: 1,
    tone: 'rich-blue',
    severity: 'hindering',
  },

  {
    id: 'downpour',
    label: 'Downpour',
    column: 2,
    row: 2,
    tone: 'deep-cool',
    severity: 'hindering',
  },
  {
    id: 'warm-storm',
    label: 'Warm Storm',
    column: 4,
    row: 2,
    tone: 'rich-blue',
    severity: 'hindering',
  },

  {
    id: 'warm-rain',
    label: 'Warm Rain',
    column: 1,
    row: 3,
    tone: 'cool',
  },
  {
    id: 'cloudy-humid',
    label: 'Cloudy\n& Humid',
    column: 3,
    row: 3,
    tone: 'deep-cool',
  },
  {
    id: 'fierce-wind',
    label: 'Fierce\nWind',
    column: 5,
    row: 3,
    tone: 'cool',
    severity: 'hindering',
  },

  {
    id: 'short-warm-showers',
    label: 'Short, Warm\nShowers',
    column: 2,
    row: 4,
    tone: 'neutral',
    startingRoll: 2,
  },
  {
    id: 'cloudy-windy',
    label: 'Cloudy\n& Windy',
    column: 4,
    row: 4,
    tone: 'cool',
    startingRoll: 3,
  },

  {
    id: 'warm-drizzle',
    label: 'Warm\nDrizzle',
    column: 1,
    row: 5,
    tone: 'mild',
    startingRoll: 12,
  },
  {
    id: 'pleasantly-warm',
    label: 'Pleasantly\nWarm',
    column: 3,
    row: 5,
    tone: 'neutral',
  },
  {
    id: 'partly-cloudy-nippy',
    label: 'Partly\nCloudy\n& Nippy',
    column: 5,
    row: 5,
    tone: 'neutral',
    startingRoll: 4,
  },

  {
    id: 'warm-cloudy',
    label: 'Warm &\nCloudy',
    column: 2,
    row: 6,
    tone: 'mild',
    startingRoll: 9,
  },
  {
    id: 'warm-breeze',
    label: 'Warm\nBreeze',
    column: 4,
    row: 6,
    tone: 'mild',
    startingRoll: 6,
  },

  {
    id: 'hot-muggy',
    label: 'Hot &\nMuggy',
    column: 1,
    row: 7,
    tone: 'hot',
    severity: 'hindering',
  },
  {
    id: 'hot-dry',
    label: 'Hot & Dry',
    column: 3,
    row: 7,
    tone: 'hot',
    severity: 'hindering',
    startingRoll: 5,
  },
  {
    id: 'clear-nippy',
    label: 'Clear\n& Nippy',
    column: 5,
    row: 7,
    tone: 'neutral',
    startingRoll: 8,
  },

  {
    id: 'hot-windy',
    label: 'Hot &\nWindy',
    column: 2,
    row: 8,
    tone: 'hot',
    severity: 'hindering',
    startingRoll: 11,
  },
  {
    id: 'sunny-clear',
    label: 'Sunny\n& Clear',
    column: 4,
    row: 8,
    tone: 'mild',
    startingRoll: 7,
  },

  {
    id: 'dry-heat-surge',
    label: 'Dry Heat\nSurge',
    column: 3,
    row: 9,
    tone: 'hot',
    severity: 'hindering',
    startingRoll: 10,
  },
]

const autumnHexes: WeatherHexData[] = [
  {
    id: 'goose-summer',
    label: 'Goose\nSummer',
    column: 3,
    row: 1,
    tone: 'mild',
    startingRoll: 12,
  },

  {
    id: 'pleasantly-warm',
    label: 'Pleasantly\nWarm',
    column: 2,
    row: 2,
    tone: 'mild',
    startingRoll: 11,
  },
  {
    id: 'sporadic-gusts',
    label: 'Sporadic\nGusts',
    column: 4,
    row: 2,
    tone: 'neutral',
    severity: 'hindering',
  },

  {
    id: 'sunny-nippy',
    label: 'Sunny\n& Nippy',
    column: 1,
    row: 3,
    tone: 'neutral',
  },
  {
    id: 'sunny-clear',
    label: 'Sunny\n& Clear',
    column: 3,
    row: 3,
    tone: 'mild',
    startingRoll: 10,
  },
  {
    id: 'cold-winds',
    label: 'Cold Winds',
    column: 5,
    row: 3,
    tone: 'cool',
  },

  {
    id: 'sunny-cloudy',
    label: 'Sunny &\nCloudy',
    column: 2,
    row: 4,
    tone: 'neutral',
  },
  {
    id: 'cold-wafts-mist',
    label: 'Cold Wafts\nof Mist',
    column: 4,
    row: 4,
    tone: 'neutral',
    startingRoll: 3,
  },

  {
    id: 'drizzle',
    label: 'Drizzle',
    column: 1,
    row: 5,
    tone: 'cool',
  },
  {
    id: 'humid-cloudy',
    label: 'Humid &\nCloudy',
    column: 3,
    row: 5,
    tone: 'cool',
  },
  {
    id: 'frosty-cloudy',
    label: 'Frosty &\nCloudy',
    column: 5,
    row: 5,
    tone: 'pale-cool',
    startingRoll: 6,
  },

  {
    id: 'rain-gusts',
    label: 'Rain &\nGusts',
    column: 2,
    row: 6,
    tone: 'deep-cool',
  },
  {
    id: 'thick-fog-soup',
    label: 'Thick Fog\nSoup',
    column: 4,
    row: 6,
    tone: 'cool',
    severity: 'hindering',
    startingRoll: 4,
  },

  {
    id: 'rainy-windstorm',
    label: 'Rainy\nWindstorm',
    column: 1,
    row: 7,
    tone: 'rich-blue',
    severity: 'hindering',
  },
  {
    id: 'rain-fog',
    label: 'Rain\n& Fog',
    column: 3,
    row: 7,
    tone: 'deep-cool',
    startingRoll: 5,
  },
  {
    id: 'cloudy-nippy',
    label: 'Cloudy\n& Nippy',
    column: 5,
    row: 7,
    tone: 'neutral',
    startingRoll: 7,
  },

  {
    id: 'heavy-downpour',
    label: 'Heavy\nDownpour',
    column: 2,
    row: 8,
    tone: 'rich-blue',
    severity: 'hindering',
    startingRoll: 2,
  },
  {
    id: 'windy-clear',
    label: 'Windy\n& Clear',
    column: 4,
    row: 8,
    tone: 'cool',
    startingRoll: 8,
  },

  {
    id: 'short-light-showers',
    label: 'Short, Light\nShowers',
    column: 3,
    row: 9,
    tone: 'deep-cool',
    severity: 'hindering',
    startingRoll: 9,
  },
]

const winterHexes: WeatherHexData[] = [
  {
    id: 'sunny-nippy',
    label: 'Sunny\n& Nippy',
    column: 3,
    row: 1,
    tone: 'neutral',
    startingRoll: 6,
  },

  {
    id: 'cloudy-nippy',
    label: 'Cloudy\n& Nippy',
    column: 2,
    row: 2,
    tone: 'neutral',
    startingRoll: 7,
  },
  {
    id: 'light-drizzle',
    label: 'Light\nDrizzle',
    column: 4,
    row: 2,
    tone: 'cool',
  },

  {
    id: 'cold-clear',
    label: 'Cold &\nClear',
    column: 1,
    row: 3,
    tone: 'cool',
    startingRoll: 8,
  },
  {
    id: 'cold-fog-wafts',
    label: 'Cold Fog\nWafts',
    column: 3,
    row: 3,
    tone: 'cool',
    startingRoll: 10,
  },
  {
    id: 'heavy-rain',
    label: 'Heavy\nRain',
    column: 5,
    row: 3,
    tone: 'deep-cool',
    severity: 'hindering',
  },

  {
    id: 'clear-windy',
    label: 'Clear &\nWindy',
    column: 2,
    row: 4,
    tone: 'cool',
    startingRoll: 9,
  },
  {
    id: 'cold-rain-showers',
    label: 'Cold Rain\nShowers',
    column: 4,
    row: 4,
    tone: 'deep-cool',
    severity: 'hindering',
    startingRoll: 11,
  },

  {
    id: 'hail',
    label: 'Hail',
    column: 1,
    row: 5,
    tone: 'pale-cool',
    startingRoll: 3,
  },
  {
    id: 'cold-humid',
    label: 'Cold &\nHumid',
    column: 3,
    row: 5,
    tone: 'cool',
  },
  {
    id: 'cold-winds',
    label: 'Cold Winds',
    column: 5,
    row: 5,
    tone: 'cool',
    startingRoll: 12,
  },

  {
    id: 'snowy-rain',
    label: 'Snowy Rain',
    column: 2,
    row: 6,
    tone: 'pale-cool',
  },
  {
    id: 'cold-cloudy',
    label: 'Cold &\nCloudy',
    column: 4,
    row: 6,
    tone: 'cool',
  },

  {
    id: 'blizzard',
    label: 'Blizzard',
    column: 1,
    row: 7,
    tone: 'light-blue',
    severity: 'hindering',
    startingRoll: 2,
  },
  {
    id: 'wet-snowfall',
    label: 'Wet\nSnowfall',
    column: 3,
    row: 7,
    tone: 'pale-cool',
    startingRoll: 5,
  },
  {
    id: 'icy-cloudy',
    label: 'Icy &\nCloudy',
    column: 5,
    row: 7,
    tone: 'pale-cool',
  },

  {
    id: 'windy-snowy',
    label: 'Windy &\nSnowy',
    column: 2,
    row: 8,
    tone: 'light-blue',
    severity: 'hindering',
  },
  {
    id: 'sleet',
    label: 'Sleet',
    column: 4,
    row: 8,
    tone: 'pale-cool',
  },

  {
    id: 'light-snowfall',
    label: 'Light\nSnowfall',
    column: 3,
    row: 9,
    tone: 'light-blue',
    severity: 'hindering',
    startingRoll: 4,
  },
]

function WeatherHex({
  hex,
  isCurrent,
  onSelect,
}: {
  hex: WeatherHexData
  isCurrent: boolean
  onSelect: () => void
}) {
  return (
    <button
        type="button"
        className={
            isCurrent
            ? `weather-hex weather-hex-${hex.tone} weather-hex-current`
            : `weather-hex weather-hex-${hex.tone}`
        }
        style={{
            gridColumn: hex.column,
            gridRow: hex.row,
        }}
        onClick={onSelect}
        aria-pressed={isCurrent}
        aria-label={`Set current weather to ${hex.label.replace('\n', ' ')}`}
        >
      <span className="weather-hex-label">
        {hex.label
          .split('\n')
          .map((line, index) => (
            <span key={`${hex.id}-${index}`}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
      </span>

      {hex.severity === 'hindering' && (
        <span
          className="weather-hex-severity"
          aria-label="Hindering weather"
          title="Hindering weather"
        >
          ▲
        </span>
      )}
      {hex.startingRoll !== undefined && (
        <span className="weather-hex-start-roll">
            {Array.isArray(hex.startingRoll)
            ? hex.startingRoll.join(', ')
            : hex.startingRoll}
        </span>
        )}
    </button>
  )
}

function WeatherMovementHex() {
  return (
    <div className="weather-movement">
      <div className="weather-movement-diagram">
        <span className="movement-roll movement-roll-n">
          11
        </span>

        <span className="movement-roll movement-roll-ne">
          8
        </span>

        <span className="movement-roll movement-roll-se">
          7
        </span>

        <span className="movement-roll movement-roll-s">
          5, 6
        </span>

        <span className="movement-roll movement-roll-sw">
          3, 4
        </span>

        <span className="movement-roll movement-roll-nw">
          2, 12
        </span>

        <div className="weather-movement-hex">
          <div className="movement-quarter movement-quarter-nw" />
          <div className="movement-quarter movement-quarter-ne" />
          <div className="movement-quarter movement-quarter-sw" />
          <div className="movement-quarter movement-quarter-se" />

          <div className="weather-movement-repeat">
            <strong>9, 10</strong>
            <span>Weather repeats</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WeatherModulePage({
  campaign,
  module,
  onDeleteModule,
}: {
  campaign: Campaign
  module: CharacterModule
  onDeleteModule: (
    module: CharacterModule
  ) => void
}) {
    const [
    weatherModuleId,
    setWeatherModuleId,
    ] = useState<string | null>(null)

    const [saveStatus, setSaveStatus] =
        useState<SaveStatusState>('saved')

  const [
    selectedSeason,
    setSelectedSeason,
  ] = useState<Season>('spring')

  const [
    currentWeather,
    setCurrentWeather,
    ] = useState<{
    season: Season
    hexId: string
    } | null>(null)

    useEffect(() => {
    let cancelled = false

    async function loadWeather() {
        const character =
        await getOrCreateCharacter(
            campaign.id
        )

        const module =
        await getWeatherModule(
            character.id
        )

        if (!module || cancelled) {
        return
        }

        const data =
        await getOrCreateWeatherModuleData(
            module.id
        )

        if (cancelled) {
        return
        }

        setWeatherModuleId(module.id)

        if (
        data.currentSeason &&
        data.currentHexId
        ) {
        setCurrentWeather({
            season: data.currentSeason,
            hexId: data.currentHexId,
        })
        }
    }

    void loadWeather()

    return () => {
        cancelled = true
    }
    }, [campaign.id])

    async function handleWeatherSelect(
        season: Season,
        hexId: string
        ) {
        setCurrentWeather({
            season,
            hexId,
        })

        if (!weatherModuleId) {
            return
        }

        try {
            setSaveStatus('saving')

            await updateWeatherModuleData(
            weatherModuleId,
            {
                currentSeason: season,
                currentHexId: hexId,
            }
            )

            setSaveStatus('saved')
        } catch (error) {
            console.error(
            'Could not save Weather.',
            error
            )

            setSaveStatus('error')
        }
        }

  const selectedSeasonLabel =
    seasons.find(
      (season) =>
        season.id === selectedSeason
    )?.label ?? 'Spring'

    const seasonHexes: Record<
        Season,
        WeatherHexData[]
    > = {
        spring: springHexes,
        summer: summerHexes,
        autumn: autumnHexes,
        winter: winterHexes,
    }

const selectedSeasonHexes =
  seasonHexes[selectedSeason]

const currentWeatherHexes =
  currentWeather
    ? seasonHexes[currentWeather.season]
    : []

const currentWeatherHex =
  currentWeather
    ? currentWeatherHexes.find(
        (hex) =>
          hex.id === currentWeather.hexId
      )
    : undefined

    const currentWeatherSeasonLabel =
    currentWeather
        ? seasons.find(
            (season) =>
            season.id === currentWeather.season
        )?.label
        : undefined

  return (
    <>
      <section className="page left-page weather-page distress-b">
        <header className="weather-heading page-heading-with-status">
            <div className="page-heading-copy">
                <h1 className="page-title">
                Weather
                </h1>

                <p className="page-intro">
                See what the skies have in store
                for your next stretch of road.
                </p>
            </div>

            <div className="page-heading-actions">
                <SaveStatus
                status={saveStatus}
                />

                <GuideHelpButton topicId="weather" />
            </div>
        </header>

        <div className="weather-left-content">
          <section className="weather-info-panel">
            <h2 className="section-title">
                Current Weather
            </h2>

            {currentWeatherHex ? (
                <div className="weather-current">
                <div className="weather-current-heading">
                    {currentWeatherHex.label.replace(
                    '\n',
                    ' '
                    )}
                </div>

                <div className="weather-current-season">
                    {currentWeatherSeasonLabel}
                </div>

                {currentWeatherHex.severity ===
                    'hindering' && (
                    <div className="weather-current-severity">
                    <span aria-hidden="true">
                        ▲
                    </span>

                    <span>
                        Hindering weather
                    </span>
                    </div>
                )}
                </div>
            ) : (
                <p className="empty-message">
                No weather has been set yet.
                </p>
            )}
            </section>

        <section className="weather-info-panel">
        <h2 className="section-title">
            Starting Weather
        </h2>

        <p>
            At the start of a season,
            roll 2d6 and find the
            corresponding number on the
            seasonal weather hex.
        </p>
        </section>

        <section className="weather-info-panel weather-change-panel">
            <div className="weather-change-layout">
                <div className="weather-change-copy">
                <h2 className="section-title">
                    Weather Change
                </h2>

                <p>
                    At the beginning of a day,
                    roll 2d6 on the movement hex
                    to see how the weather changes.
                </p>
                </div>

                <WeatherMovementHex />
            </div>
        </section>
        </div>
      </section>

      <section className="page right-page weather-page distress-d">
        <nav
          className="weather-season-selector"
          aria-label="Season"
        >
          {seasons.map((season) => (
            <button
              key={season.id}
              type="button"
              className={
                selectedSeason === season.id
                  ? 'secondary-button weather-season-button active'
                  : 'secondary-button weather-season-button'
              }
              onClick={() =>
                setSelectedSeason(
                  season.id
                )
              }
            >
              {season.label}
            </button>
          ))}
        </nav>

        <div className="weather-board-heading">
          <h2 className="section-title">
            {selectedSeasonLabel}
          </h2>
        </div>

        {selectedSeasonHexes.length > 0 ? (
            <>
                <div className="weather-hex-grid">
                {selectedSeasonHexes.map((hex) => (
                    <WeatherHex
                    key={hex.id}
                    hex={hex}
                    isCurrent={
                        currentWeather?.season ===
                        selectedSeason &&
                        currentWeather.hexId === hex.id
                    }
                    onSelect={() =>
                        void handleWeatherSelect(
                            selectedSeason,
                            hex.id
                        )
                    }
                    />
                ))}
                </div>

                <p className="weather-severity-legend weather-board-legend">
                <span
                    className="weather-severity-symbol"
                    aria-hidden="true"
                >
                    ▲
                </span>

                <span>
                    Hindering weather
                </span>
                </p>
            </>
            ) : (
            <p className="empty-message weather-season-placeholder">
                {selectedSeasonLabel} weather
                will be added next.
            </p>
                )}

        <CharacterModuleActions
          module={module}
          onDelete={onDeleteModule}
        />
      </section>
    </>
  )
}