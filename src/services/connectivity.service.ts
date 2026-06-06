import NetInfo from '@react-native-community/netinfo'

export async function getIsOnline() {
  const state = await NetInfo.fetch()
  return Boolean(state.isConnected && state.isInternetReachable !== false)
}

export function subscribeToConnectivity(
  listener: (isOnline: boolean) => void
) {
  return NetInfo.addEventListener((state) => {
    const isOnline = Boolean(
      state.isConnected && state.isInternetReachable !== false
    )

    listener(isOnline)
  })
}