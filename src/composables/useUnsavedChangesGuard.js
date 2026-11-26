import { ref, shallowRef, unref } from 'vue'

// 변경 감지는 호출한 화면에서 담당한다. 여기서는 확인 후 실행할 동작만 보관한다.
export function useUnsavedChangesGuard(hasUnsavedChanges, busy) {
  const pendingAction = ref('')
  const pendingTrigger = shallowRef(null)
  let pendingWork = null

  function cancelDiscard() {
    pendingAction.value = ''
    pendingTrigger.value = null
    pendingWork = null
  }

  async function requestDiscard(action, work, event) {
    if (unref(busy) || pendingAction.value) return
    if (!unref(hasUnsavedChanges)) return work()
    pendingWork = work
    pendingTrigger.value = event?.currentTarget
    pendingAction.value = action
  }

  async function confirmDiscard() {
    if (unref(busy) || !pendingWork) return
    const work = pendingWork
    cancelDiscard()
    await work()
  }

  return { pendingAction, pendingTrigger, requestDiscard, confirmDiscard, cancelDiscard }
}
