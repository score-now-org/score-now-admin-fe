import { inject, provide, shallowRef } from 'vue'

const adminConfirmKey = Symbol('adminConfirm')

export function provideAdminConfirm() {
  const confirmation = shallowRef(null)
  let resolveRequest

  function requestConfirmation(options, returnFocus) {
    if (confirmation.value) return Promise.resolve(false)
    return new Promise((resolve) => {
      resolveRequest = resolve
      confirmation.value = { ...options, returnFocus }
    })
  }

  function settle(confirmed) {
    const resolve = resolveRequest
    resolveRequest = null
    confirmation.value = null
    resolve?.(confirmed)
  }

  provide(adminConfirmKey, requestConfirmation)
  return {
    confirmation,
    confirm: () => settle(true),
    cancel: () => settle(false),
  }
}

export function useAdminConfirm() {
  return inject(adminConfirmKey)
}
