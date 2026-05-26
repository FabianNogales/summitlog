import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '../../theme/colors'
import { Ruler, TrendingUp, Flame, Play, Square } from 'lucide-react-native' 
import { AuthButton } from '../auth/AuthButton'

interface RecordBottomPanelProps {
  isTracking: boolean
  isStarting: boolean
  isFinishing: boolean
  distanceM: number
  elevationGainM: number
  calories: number
  onStart: () => void
  onStop: () => void
  pendingCount: number
  syncing: boolean
  onSync: () => void
  syncButtonTitle: string
}

export function RecordBottomPanel({
  isTracking,
  isStarting,
  isFinishing,
  distanceM,
  elevationGainM,
  calories,
  onStart,
  onStop,
  pendingCount,
  syncing,
  onSync,
  syncButtonTitle,
}: RecordBottomPanelProps) {
  
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let interval: any
    if (isTracking) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else if (!isTracking && !isStarting && !isFinishing) {
      setSeconds(0) 
    }
    return () => clearInterval(interval)
  }, [isTracking, isStarting, isFinishing])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const distanceKm = (distanceM / 1000).toFixed(2)

  return (
    <View style={styles.container}>
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeLabel}>TIEMPO</Text>
        <Text style={styles.timeValue}>{formatTime(seconds)}</Text> 
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Ruler size={20} color={colors.primary} />
          <Text style={styles.metricValue}>{distanceKm} <Text style={styles.metricUnit}>km</Text></Text>
          <Text style={styles.metricLabel}>Distancia</Text>
        </View>

        <View style={styles.metricCard}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={styles.metricValue}>
            +{Math.round(elevationGainM)} <Text style={styles.metricUnit}>m</Text>
          </Text>
          <Text style={styles.metricLabel}>Desnivel</Text>
        </View>

        <View style={styles.metricCard}>
          <Flame size={20} color={colors.primary} />
          <Text style={styles.metricValue}>
            {calories} <Text style={styles.metricUnit}>kcal</Text>
          </Text>
          <Text style={styles.metricLabel}>Calorías</Text>
        </View>
      </View> 

      <View style={styles.actionRow}>
        {!isTracking ? (
          <TouchableOpacity 
            style={[styles.recordButton, styles.startButton]} 
            onPress={() => {
              setSeconds(0);
              onStart();
            }}
            disabled={isStarting}
          >
            <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.recordButton, styles.stopButton]} 
            onPress={onStop}
            disabled={isFinishing}
          >
            <Square size={24} color="#fff" fill="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {!isTracking && (
        <View style={[styles.syncContainer, pendingCount === 0 && { opacity: 0.5 }]}>
          <AuthButton
            title={syncButtonTitle}
            onPress={onSync}
            loading={syncing}
          />
        </View>
      )}
      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated, 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  timeValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: colors.bgCard || '#2C2C2E', 
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    width: '31%',
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricUnit: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  actionRow: {
    alignItems: 'center',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#FF6B00',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  syncContainer: {
    width: '100%',
    marginTop: 16,
  }
})