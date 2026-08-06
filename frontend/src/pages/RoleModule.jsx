import { Briefcase } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'

export default function RoleModule() {
  return (
    <EmptyState
      icon={Briefcase}
      title="Role tools"
      description="Role-specific features (clients, projects, investments, sales) will be available in Phases 6–9. Your dashboard adapts to your role automatically."
    />
  )
}
