import AsyncStorage from "@react-native-async-storage/async-storage";
import { TrackItem } from "./TrackLibraryService";
import * as Crypto from "expo-crypto";

export interface Project {
  id: string;
  title: string;
  tracks: TrackItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: number;
}

//todo - testflight update into env for better approach
const PROJECT_INDEX_KEY = "@melodizr_project_index";
const PROJECT_PREFIX = "@melodizr_project_";

export const ProjectService = {
  createProject: async (firstTrack: TrackItem): Promise<Project> => {
    try {
      const newProjectId = Crypto.randomUUID();
      const now = Date.now();

      const newProject: Project = {
        id: newProjectId,
        title: `New Project ${new Date().toLocaleDateString()}`,
        tracks: [firstTrack],
        createdAt: now,
        updatedAt: now,
      };

      await AsyncStorage.setItem(
        `${PROJECT_PREFIX}${newProjectId}`,
        JSON.stringify(newProject)
      );

      // 인덱스(목록) 업데이트
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
};
