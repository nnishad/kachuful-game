import 'event-target-polyfill'

type EventInitLike = {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

type MessageEventInitLike<T = unknown> = {
  data?: T
  origin?: string
  lastEventId?: string
  ports?: ReadonlyArray<unknown>
} & EventInitLike

type GlobalEventScope = typeof globalThis & {
  Event: typeof Event
  EventTarget: typeof EventTarget
  MessageEvent?: typeof MessageEvent
}

type EventConstructorPatched = typeof Event & {
  __cardMastersHasInstancePatched__?: boolean
}

const isEventLike = (value: unknown): value is { type: string } => {
  if (!value || typeof value !== 'object') {
    return false
  }
  return typeof (value as { type?: unknown }).type === 'string'
}

const ensureEventPolyfills = () => {
  const globalScope = globalThis as GlobalEventScope

  // React Native on Hermes exposes EventTarget but MessageEvent/CloseEvent do not inherit from it.
  const needsMessageEventPolyfill = (() => {
    const existing = globalScope.MessageEvent
    if (typeof existing !== 'function') {
      return true
    }
    try {
      const test = new existing('cardmasters-polyfill-test')
      return !(test instanceof globalScope.Event)
    } catch {
      return true
    }
  })()

  if (needsMessageEventPolyfill) {
    class MessageEventPolyfill<T = unknown> extends globalScope.Event {
      data: T
      origin: string
      lastEventId: string
      ports: ReadonlyArray<unknown>

      constructor(type: string, eventInitDict: MessageEventInitLike<T> = {}) {
        super(type, eventInitDict)
        this.data = (eventInitDict.data ?? null) as T
        this.origin = eventInitDict.origin ?? ''
        this.lastEventId = eventInitDict.lastEventId ?? ''
        this.ports = eventInitDict.ports ?? []
      }
    }

    globalScope.MessageEvent = MessageEventPolyfill as unknown as typeof MessageEvent
  }

  const patchEventInstanceCheck = () => {
    const EventCtor = globalScope.Event as EventConstructorPatched | undefined
    if (!EventCtor || EventCtor.__cardMastersHasInstancePatched__) {
      return
    }

    const originalHasInstance =
      EventCtor[Symbol.hasInstance] ?? Function.prototype[Symbol.hasInstance]

    Object.defineProperty(EventCtor, Symbol.hasInstance, {
      value(instance: unknown) {
        if (typeof originalHasInstance === 'function' && originalHasInstance.call(this, instance)) {
          return true
        }
        return isEventLike(instance)
      },
      configurable: true,
    })

    EventCtor.__cardMastersHasInstancePatched__ = true
  }

  patchEventInstanceCheck()
}

ensureEventPolyfills()

export {}
