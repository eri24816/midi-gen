import { onMounted, ref, defineModel, type Ref, watch } from "vue" 
import type { WatchSource, WatchCallback, WatchOptions, WatchHandle, OnCleanup } from "@vue/reactivity";

type MaybeUndefined<T, I> = I extends true ? T | undefined : T;

function watchIgnorable<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, MaybeUndefined<T, Immediate>>, options?: WatchOptions<Immediate>):
    {
        unwatch: WatchHandle,
        ignoreUpdates: (updater: () => void) => void,
    } {
    let ignoreNext = 0;
    const cbWrapper = (value: T, oldValue: MaybeUndefined<T, Immediate>, onCleanup: OnCleanup) => {

        if (ignoreNext) {

            ignoreNext -= 1;

            return;
        }
        cb(value, oldValue, onCleanup);
    };
    const unwatch = watch(source, cbWrapper, options);
    return {
        unwatch:unwatch,
        ignoreUpdates: (updater: () => void) => {
            ignoreNext += 1;
            updater();
        }
    };
}

export function useAttributeCellLogic<T>(el: Ref<HTMLElement | null>, realValue: Ref<T>, userValue: Ref<T>, isDetermined: Ref<boolean>, validator: (value: T) => boolean = (value: T) => true) {
    onMounted(() => {
    // right click to toggle
        el.value!.addEventListener('contextmenu', (event: MouseEvent) => {
            isDetermined.value = !isDetermined.value;
            event.preventDefault();
        });
    });

    watch(isDetermined, (newValue: boolean) => {
        el.value!.classList.toggle('determined', newValue);
        if (!newValue && userValue.value !== realValue.value) {
            ignoreUpdates(() => {
                userValue.value = realValue.value;
            });
        }
    });

    const { unwatch, ignoreUpdates } = watchIgnorable(userValue, (newValue: T, oldValue: T) => {
        console.log(oldValue, newValue, validator(newValue));
        if(!validator(newValue)){
            ignoreUpdates(() => {
                userValue.value = oldValue;
            });
        }
        else{
            isDetermined.value = true;
        }
    });

    watch(realValue, () => {
        if(!isDetermined.value) {
            ignoreUpdates(() => {
                userValue.value = realValue.value;
            });
        }
    });

    return {
        isDetermined,
        realValue,
        userValue,
    };
}
