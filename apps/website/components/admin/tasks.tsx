import { deleteTask, logHours, setTaskStatus } from '@/app/admin/actions'
import { ConfirmButton } from '@/components/admin/client'
import { Badge, Empty, inputCls } from '@/components/admin/ui'
import { relDay, today } from '@/lib/admin/format'
import type { Task } from '@/lib/admin/types'

const order: Record<string, number> = { Doing: 0, 'To do': 1, Done: 2 }

/** Tasks with one-click status changes and a quick "log time" box. */
export function TaskList({ tasks, back, projectName }: { tasks: Task[]; back: string; projectName?: (id: number | null) => string }) {
  if (!tasks.length) return <Empty>No tasks yet.</Empty>
  const t = today()
  const sorted = [...tasks].sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      (a.status === 'Done'
        ? (b.done_at ?? '').localeCompare(a.done_at ?? '')
        : (a.due_on ?? '9').localeCompare(b.due_on ?? '9')),
  )
  return (
    <ul>
      {sorted.map((k) => {
        const next = k.status === 'To do' ? 'Doing' : k.status === 'Doing' ? 'Done' : 'To do'
        const nextLabel = k.status === 'To do' ? 'Start' : k.status === 'Doing' ? 'Done' : 'Reopen'
        const late = k.status !== 'Done' && k.due_on && k.due_on < t
        return (
          <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-3 last:border-b-0">
            <form action={setTaskStatus}>
              <input type="hidden" name="id" value={k.id} />
              <input type="hidden" name="status" value={next} />
              <input type="hidden" name="back" value={back} />
              <button type="submit" className="btn-quiet btn-sm min-w-[76px]">{nextLabel}</button>
            </form>
            <div className="min-w-0 flex-1">
              <div className={`text-[15px] ${k.status === 'Done' ? 'text-text-muted line-through' : 'text-text-primary'}`}>{k.title}</div>
              <div className="text-[13px] text-text-muted">
                {[
                  projectName?.(k.project_id),
                  k.due_on ? <span key="d" className={late ? 'adm-bad-text' : ''}>due {relDay(k.due_on)}</span> : null,
                  Number(k.hours) ? `${Number(k.hours)} h` : null,
                ]
                  .filter(Boolean)
                  .map((part, i) => (
                    <span key={i}>
                      {i ? ' · ' : ''}
                      {part}
                    </span>
                  ))}
              </div>
            </div>
            <Badge>{k.status}</Badge>
            {k.status !== 'Done' ? (
              <form action={logHours} className="flex items-center gap-1">
                <input type="hidden" name="id" value={k.id} />
                <input type="hidden" name="back" value={back} />
                <input name="add_hours" inputMode="decimal" placeholder="+h" aria-label={`Hours to add to ${k.title}`} className={`${inputCls} w-16 py-1 text-[13px]`} />
                <button type="submit" className="text-[13px] text-accent">Log</button>
              </form>
            ) : null}
            <form action={deleteTask}>
              <input type="hidden" name="id" value={k.id} />
              <input type="hidden" name="back" value={back} />
              <ConfirmButton message={`Delete "${k.title}"?`} className="text-[13px] text-text-muted hover:text-text-primary">
                Delete
              </ConfirmButton>
            </form>
          </li>
        )
      })}
    </ul>
  )
}
