import AsyncStorage from "@react-native-async-storage/async-storage";
import { TrackItem } from "./TrackLibraryService";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";

export interface Project {
  id: string;
  title: string;
  tracks: TrackItem[];
  createdAt: number;
  updatedAt: number;
  bpm?: number;
  bars?: number;
  durationMillis?: number;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: number;
}

const PROJECT_INDEX_KEY = "@melodizr_project_index";
const PROJECT_PREFIX = "@melodizr_project_";

export const ProjectService = {
  createProject: async (firstTrack: TrackItem): Promise<Project> => {
    try {
      const newProjectId = Crypto.randomUUID();
      const now = Date.now();

      let projectSettings = {};

      if (firstTrack.playbackSettings) {
        projectSettings = {
          bpm: firstTrack.playbackSettings.targetBpm,
          bars: firstTrack.playbackSettings.targetBars,
          durationMillis: firstTrack.durationMillis,
        };
      }

      const newProject: Project = {
        id: newProjectId,
        title: `New Project ${new Date().toLocaleDateString()}`,
        tracks: [firstTrack],
        createdAt: now,
        updatedAt: now,
        ...projectSettings,
      };

      await AsyncStorage.setItem(
        `${PROJECT_PREFIX}${newProjectId}`,
        JSON.stringify(newProject)
      );

      await ProjectService.addToIndex({
        id: newProjectId,
        title: newProject.title,
        updatedAt: now,
      });

      return newProject;
    } catch (e) {
      console.error("Failed to create project", e);
      throw e;
    }
  },

  updateProject: async (project: Project): Promise<void> => {
    try {
      const updatedProject = { ...project, updatedAt: Date.now() };

      await AsyncStorage.setItem(
        `${PROJECT_PREFIX}${project.id}`,
        JSON.stringify(updatedProject)
      );

      await ProjectService.updateIndexTime(project.id, updatedProject.title);
    } catch (e) {
      console.error("Failed to update project", e);
    }
  },

  renameProject: async (id: string, newTitle: string): Promise<void> => {
    try {
      const project = await ProjectService.getProject(id);
      if (project) {
        const updatedProject = { ...project, title: newTitle };
        await ProjectService.updateProject(updatedProject);
      }
    } catch (e) {
      console.error("Failed to rename project", e);
      throw e;
    }
  },

  renameTrack: async (
    projectId: string,
    trackId: string,
    newTitle: string
  ): Promise<void> => {
    try {
      const project = await ProjectService.getProject(projectId);
      if (project) {
        const updatedTracks = project.tracks.map((t) =>
          t.id === trackId ? { ...t, title: newTitle } : t
        );
        const updatedProject = { ...project, tracks: updatedTracks };
        await ProjectService.updateProject(updatedProject);
      }
    } catch (e) {
      console.error("Failed to rename track", e);
      throw e;
    }
  },

  getProject: async (id: string): Promise<Project | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(`${PROJECT_PREFIX}${id}`);
      if (!jsonValue) return null;

      const parsedProject = JSON.parse(jsonValue);

      if (!parsedProject.tracks) {
        parsedProject.tracks = [];
      }

      return parsedProject;
    } catch (e) {
      console.error("Failed to load project", e);
      return null;
    }
  },

  addToIndex: async (summary: ProjectSummary) => {
    const index = await ProjectService.getProjectList();
    const newIndex = [summary, ...index];
    await AsyncStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(newIndex));
  },

  getProjectList: async (): Promise<ProjectSummary[]> => {
    const json = await AsyncStorage.getItem(PROJECT_INDEX_KEY);
    return json ? JSON.parse(json) : [];
  },

  updateIndexTime: async (id: string, title: string) => {
    const list = await ProjectService.getProjectList();
    const targetIndex = list.findIndex((p) => p.id === id);
    if (targetIndex > -1) {
      const target = list[targetIndex];
      list.splice(targetIndex, 1);
      list.unshift({ ...target, title, updatedAt: Date.now() });
      await AsyncStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(list));
    }
  },

  deleteProject: async (id: string): Promise<void> => {
    try {
      const project = await ProjectService.getProject(id);

      if (project && project.tracks) {
        for (const track of project.tracks) {
          if (track.uri) {
            try {
              await FileSystem.deleteAsync(track.uri, { idempotent: true });
            } catch (err) {
              console.log(`Failed to delete file: ${track.uri}`, err);
            }
          }
        }
      }

      await AsyncStorage.removeItem(`${PROJECT_PREFIX}${id}`);

      const list = await ProjectService.getProjectList();
      const newList = list.filter((p) => p.id !== id);
      await AsyncStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to delete project", e);
      throw e;
    }
  },
};
