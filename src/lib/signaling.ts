// app/lib/signaling.ts
export const signalingData: Record<
  string,
  {
    offer: any | null;
    answer: any | null;
    cameraCandidates: any[];
    clientCandidates: any[];
    cameraConnection: ReadableStreamDefaultController | null;
    clientConnection: ReadableStreamDefaultController | null;
  }
> = {};