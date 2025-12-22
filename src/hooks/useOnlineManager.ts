import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

export function useOnlineManager() {
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      onlineManager.setOnline(!!state.isConnected);
    });
    return () => unsub();
  }, []);
}
