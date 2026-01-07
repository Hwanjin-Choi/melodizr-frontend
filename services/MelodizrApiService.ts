import * as FileSystem from "expo-file-system";

const API_URL = "http://184.145.155.117:57476/melodizr_api/";

export const MelodizrApiService = {
  convertAudio: async (
    audioUri: string,
    mode: string,
    bpm: number,
    textPrompt: string
  ): Promise<string> => {
    try {
      console.log(
        `[API] 요청 시작: Mode=${mode}, BPM=${bpm}, Prompt=${textPrompt}`
      );

      const formData = new FormData();
      const filename = "recording.wav";

      // @ts-ignore: React Native FormData
      formData.append("audio", {
        uri: audioUri,
        name: filename,
        type: "audio/wav",
      });
      formData.append("user_id", "af16e260-c6a1-4133-9d7f-5f3a015da82c");
      formData.append("mode", mode);
      formData.append("bpm", bpm.toString());
      formData.append("text_prompt", textPrompt || "");

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

      // 4. 결과물(WAV) 저장
      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error("파일 읽기 실패"));
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(",")[1];
            const newPath = `${
              FileSystem.documentDirectory
            }converted_${Date.now()}.wav`;

            await FileSystem.writeAsStringAsync(newPath, base64data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log("[API] 변환 성공:", newPath);
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
