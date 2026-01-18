import * as FileSystem from "expo-file-system";

const API_URL = "http://184.145.155.117:57490/melodizr_api/";

export const MelodizrApiService = {
  convertAudio: async (
    audioUri: string,
    mode: string,
    bpm: number,
    textPrompt: string,
    instrument: string,
    keyHint: string,
    tunePreset: string
  ): Promise<string> => {
    try {
      console.log(
        `[API] 요청 시작: Mode=${mode}, BPM=${bpm}, Prompt=${textPrompt} instrument=${instrument} keyHint=${keyHint} tunePreset=${tunePreset}  `
      );

      const formData = new FormData();
      const filename = "recording.wav";

      // @ts-ignore: React Native FormData
      formData.append("audio", {
        uri: audioUri,
        name: filename,
        type: "audio/wav",
      });
      formData.append("user_id", "5ac8d5d0-47ff-46cf-8be8-ad639b44be63");
      formData.append("mode", mode);
      formData.append("bpm", bpm.toString());
      formData.append("text_prompt", textPrompt || "");
      formData.append("wav_only", "true");
      formData.append("instrument", instrument);
      formData.append("key_hint", keyHint);
      formData.append("tune_preset", tunePreset);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[API Error]", response.status, errorText);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error("파일 읽기 실패"));
        reader.onloadend = async () => {
          try {
            const resultString = reader.result as string;

            const splitResult = resultString.split(",");
            if (splitResult.length < 2) {
              console.error(
                "[API Debug] 데이터 URL 형식이 아님:",
                resultString.substring(0, 100)
              );
              throw new Error("유효하지 않은 데이터 형식입니다.");
            }

            const base64data = splitResult[1];

            const headerPrefix = base64data.substring(0, 20);
            console.log("============================================");
            console.log("[API 진단] Base64 헤더:", headerPrefix);

            if (headerPrefix.startsWith("UklGR")) {
              console.log("[API 진단] 결과: WAV 파일 형식 (RIFF 헤더 감지됨)");
            } else if (
              headerPrefix.startsWith("SUQz") ||
              headerPrefix.startsWith("/+MYx")
            ) {
              console.log("[API 진단] 결과: MP3 파일 형식 의심");
            } else {
              console.log(
                "[API 진단] 결과: 알 수 없는 형식 (WAV가 아닐 수 있음)"
              );
            }
            console.log("============================================");

            const newPath = `${
              FileSystem.documentDirectory
            }converted_${Date.now()}.wav`;

            await FileSystem.writeAsStringAsync(newPath, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log("[API] 변환 성공, 저장 경로:", newPath);
            resolve(newPath);
          } catch (e) {
            reject(e);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("============== [API Error Debug] ==============");
      if (error instanceof Error) {
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
      } else {
        console.error("Unknown Error:", error);
      }
      console.error("===============================================");
      throw error;
    }
  },
};
