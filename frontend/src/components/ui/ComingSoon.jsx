import { Construction } from 'lucide-react'
import EmptyState from './EmptyState'

/**
 * Placeholder page shown while a module is still under construction.
 * Used in Phase 3 for every feature page that arrives in a later phase.
 */
export default function ComingSoon({ title, phase, description }) {
  return (
    <EmptyState
      icon={Construction}
      title={title || 'Coming soon'}
      description={
        description ||
        `This section will be available in Phase ${phase}. Check back after that phase is complete.`
      }
    />
  )
}
