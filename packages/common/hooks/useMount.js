import { useEffect } from "react";

export default function useMount(fn,dependencies) {
    useEffect(() => {
        fn();
        // eslint-disable-next-line
    }, []);

}
