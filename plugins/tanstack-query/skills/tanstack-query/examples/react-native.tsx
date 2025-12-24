import React from 'react'
import { Text, View, Button } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

// Optional: integrate app state + net info
focusManager.setEventListener(handleFocus => {
  const subscription = () => handleFocus(true) // replace with AppState listener
  return () => subscription()
})
onlineManager.setEventListener(setOnline => {
  const unsubscribe = () => setOnline(true) // replace with NetInfo listener
  return () => unsubscribe()
})

async function fetchProfile() {
  const res = await fetch('https://example.com/api/profile')
  if (!res.ok) throw new Error('Failed to load profile')
  return res.json()
}

function Profile() {
  const { data, isFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <View>
      <Text>{data?.name ?? 'Loading…'}</Text>
      {isFetching && <Text>Syncing…</Text>}
    </View>
  )
}

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>
    </PersistQueryClientProvider>
  )
}
