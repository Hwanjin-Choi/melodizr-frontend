import React, { useCallback, useRef, useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, Spinner } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecordHeader } from "@/features/record/components/RecordHeader";
import { TrackList, type Track } from "@/features/record/components/TrackList";
import { RecordBottomBar } from "@/features/record/components/RecordBottomBarProps";
import {
  RecordBottomSheet,
  RecordBottomSheetHandle,
} from "@/features/record/components/RecordBottomSheet";
import { ProjectPlayer } from "@/features/record/components/ProjectPlayer";
import { VoiceList } from "@/features/record/components/VoiceList";

import { ProjectService, Project } from "@/services/ProjectService";
import { VoiceLibraryService, VoiceItem } from "@/services/VoiceLibraryService";

export default function RecordProjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<RecordBottomSheetHandle>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(id === "new");

  const [isProjectTab, setIsProjectTab] = useState(true);
  const [voiceLibrary, setVoiceLibrary] = useState<VoiceItem[]>([]);

  const handleTitleChange = async (newTitle: string) => {
    if (!project) return;

    const updatedProject = { ...project, title: newTitle };
    setProject(updatedProject);

    if (!isNewProject) {
      await ProjectService.updateProject(updatedProject);
    }
  };

  const loadVoices = async () => {
    try {
      const voices = await VoiceLibraryService.getVoices();
      setVoiceLibrary(voices);
    } catch (e) {
      console.error("Failed to load voices", e);
    }
  };

  useEffect(() => {
    async function init() {
      loadVoices();

      if (id === "new") {
        setProject({
          id: "temp",
          title: "새 프로젝트",
          tracks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setIsNewProject(true);
        return;
      }

      if (project && project.id === id) return;

      if (id && typeof id === "string") {
        const loaded = await ProjectService.getProject(id);
        if (loaded) {
          setProject(loaded);
          setIsNewProject(false);
        }
      }
    }
    init();
  }, [id]);

  const handleConversionComplete = async (
    originalVoice: VoiceItem,
    newTrack: Track
  ) => {
    await loadVoices();

    if (!project) return;

    let updatedProject: Project;

    if (isNewProject) {
      updatedProject = await ProjectService.createProject(newTrack);
      router.replace(`/record/${updatedProject.id}`);
      setIsNewProject(false);
    } else {
      updatedProject = {
        ...project,
        tracks: [newTrack, ...project.tracks],
      };
      await ProjectService.updateProject(updatedProject);
    }

    setProject(updatedProject);

    setIsProjectTab(true);
    bottomSheetRef.current?.close();
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!project) return;
    const newTracks = project.tracks.filter((t) => t.id !== trackId);
    const updatedProject = { ...project, tracks: newTracks };

    setProject(updatedProject);
    if (!isNewProject) {
      await ProjectService.updateProject(updatedProject);
    }
  };

  const handleDeleteVoice = async () => {
    await loadVoices();
  };

  const handleConvertFromVoice = (voice: VoiceItem) => {
    bottomSheetRef.current?.openForConversion(voice);
  };

  const handleRenameTrack = async (trackId: string, newName: string) => {
    if (!project) return;

    const updatedTracks = project.tracks.map((t) =>
      t.id === trackId ? { ...t, title: newName } : t
    );
    const updatedProject = { ...project, tracks: updatedTracks };
    setProject(updatedProject);

    if (!isNewProject) {
      await ProjectService.renameTrack(project.id, trackId, newName);
    }
  };

  if (!project) {
    return (
      <YStack flex={1} bg="$background" ai="center" jc="center">
        <Spinner size="large" color="$accent" />
      </YStack>
    );
  }

  const activeTracks = project?.tracks
    ? project.tracks.filter((t) => !t.isMuted)
    : [];

  return (
    <YStack flex={1} bg="$background" paddingTop={insets.top}>
      <RecordHeader
        isProject={isProjectTab}
        onTabChange={setIsProjectTab}
        title={project.title}
      />

      {isProjectTab ? (
        <YStack flex={1}>
          {project.tracks.length > 0 && (
            <YStack px="$4" pb="$4">
              <ProjectPlayer
                layers={activeTracks}
                title={project.title}
                onTitleChange={handleTitleChange}
              />
            </YStack>
          )}

          <TrackList
            tracks={project.tracks}
            onStartRecording={() => bottomSheetRef.current?.expand()}
            onDeleteTrack={(track) => handleDeleteTrack(track.id)}
            onToggleMute={(id) => {
              const updatedTracks = project.tracks.map((t) =>
                t.id === id ? { ...t, isMuted: !t.isMuted } : t
              );
              setProject({ ...project, tracks: updatedTracks });
            }}
            onRenameTrack={handleRenameTrack}
          />
        </YStack>
      ) : (
        // 6. VoiceList 컴포넌트 렌더링
        <VoiceList
          voices={voiceLibrary}
          onDeleteVoice={handleDeleteVoice}
          onConvertVoice={handleConvertFromVoice}
        />
      )}

      <RecordBottomBar
        visible={true}
        onOpenSheet={() => bottomSheetRef.current?.expand()}
      />

      <RecordBottomSheet
        ref={bottomSheetRef}
        onConversionComplete={handleConversionComplete}
      />
    </YStack>
  );
}
