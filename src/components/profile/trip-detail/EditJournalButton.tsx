import { AuthButton } from '../../auth/AuthButton'
import type { TripDetailData } from '../../../services/tripDetail.service'

interface EditJournalButtonProps {
  detail: TripDetailData
  onPress: () => void
}

export function EditJournalButton({ detail, onPress }: EditJournalButtonProps) {
  return (
    <AuthButton
      title="Editar bitácora"
      onPress={onPress}
      disabled={detail.trip.status !== 'completed'}
    />
  )
}