import * as FileSystem from "expo-file-system";

const BASE_URL = "http://27.65.48.179:53352";

export const TriaApiService = {
  generateAudio: async (
    timbreUri: string,
    rhythmUri: string
  ): Promise<string> => {
    try {
      console.log(`[TRIA API] 생성 요청 시작`);
      console.log(`- Timbre: ${timbreUri}`);
      console.log(`- Rhythm: ${rhythmUri}`);

      const formData = new FormData();

      // @ts-ignore
      formData.append("timbre", {
        uri: timbreUri,
        name: "timbre.wav",
        type: "audio/wav",
      });
      // @ts-ignore
      formData.append("rhythm", {
        uri: rhythmUri,
        name: "rhythm.wav",
        type: "audio/wav",
      });

      const response = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error(`[TRIA API Error] Status: ${response.status}`, errorText);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }

      // X-TRIA-Message 헤더 로그 (옵션)
      const triaMessage = response.headers.get("x-tria-message");
      if (triaMessage) {
        console.log("[TRIA API Message]", triaMessage);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error("Blob 읽기 실패"));
        reader.onloadend = async () => {
          try {
            const resultString = reader.result as string;
            const splitResult = resultString.split(",");
            if (splitResult.length < 2) {
              throw new Error("유효하지 않은 데이터 형식입니다.");
            }
            const base64data = splitResult[1];

            const newPath = `${
              FileSystem.documentDirectory
            }tria_gen_${Date.now()}.wav`;

            await FileSystem.writeAsStringAsync(newPath, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log("[TRIA API] 생성 성공, 저장 경로:", newPath);
            resolve(newPath);
          } catch (e) {
            reject(e);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("============== [TRIA API Error] ==============");
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      throw error;
    }
  },
};
