'use client'

import { useRef, useState } from 'react'
import { saveIdea } from '@/app/admin/actions'
import { Markdown } from '@/lib/admin/markdown'
import { IDEA_STATUSES, type Idea } from '@/lib/admin/types'

const TOOLS = [
  { label: 'Section', insert: '\n## ', title: 'Start a section' },
  { label: 'Subsection', insert: '\n### ', title: 'Start a subsection' },
  { label: '• Bullet', insert: '\n- ', title: 'Add a bullet point' },
  { label: '1. Numbered', insert: '\n1. ', title: 'Add a numbered point' },
  { label: 'Bold', wrap: '**', title: 'Make the selected words bold' },
]

/** Write on the left, see the formatted idea on the right as you type. */
export function IdeaEditor({ idea, back }: { idea: Idea; back: string }) {
  const [text, setText] = useState(idea.notes ?? '')
  const ref = useRef<HTMLTextAreaElement>(null)

  function apply(tool: (typeof TOOLS)[number]) {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    el.focus()
    if ('wrap' in tool && tool.wrap) {
      const picked = value.slice(s, e) || 'bold words'
      el.setRangeText(tool.wrap + picked + tool.wrap, s, e, 'end')
    } else {
      const ins = s === 0 || value[s - 1] === '\n' ? tool.insert!.replace(/^\n/, '') : tool.insert!
      // setRangeText moves the cursor at once, so typing carries on in the right place.
      el.setRangeText(ins, s, e, 'end')
    }
    setText(el.value)
  }

  return (
    <form action={saveIdea} className="a-idea-editor">
      <input type="hidden" name="id" value={idea.id} />
      <input type="hidden" name="back" value={back} />
      <div className="a-form-grid">
        <label className="a-field a-span-all">
          <span className="a-field-label">Idea</span>
          <input className="a-input" name="title" required defaultValue={idea.title} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Status</span>
          <select className="a-input" name="status" defaultValue={idea.status}>
            {IDEA_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="a-editor">
        <div className="a-editor-pane">
          <div className="a-toolbar" role="toolbar" aria-label="Formatting">
            {TOOLS.map((t) => (
              <button
                key={t.label}
                type="button"
                className="a-tool"
                title={t.title}
                // Keep the cursor in the text box, so typing carries on there.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(t)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            ref={ref}
            className="a-input a-editor-text"
            name="notes"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Notes"
            spellCheck
          />
          <p className="a-field-hint">## starts a section, ### a subsection, - a bullet point, **word** makes it bold.</p>
        </div>
        <div className="a-editor-pane a-editor-preview" aria-label="Preview">
          <span className="a-eyebrow">How it will look</span>
          <Markdown source={text || '*Nothing written yet.*'} />
        </div>
      </div>
      <div className="a-head-actions">
        <button type="submit" className="a-btn a-btn-primary">Save idea</button>
        <a href={back} className="a-btn a-btn-quiet">Cancel</a>
      </div>
    </form>
  )
}
