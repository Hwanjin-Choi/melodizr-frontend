import React, { useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { YStack, Text, H3, Card, XStack, Button, Spacer, Theme } from "tamagui";
import { Play, Calendar, Trash } from "@tamagui/lucide-icons";
import { ProjectService, ProjectSummary } from "@/services/ProjectService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProjectPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    const list = await ProjectService.getProjectList();
    setProjects(list);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handlePressProject = (projectId: string) => {
    router.push(`/record/${projectId}`);
  };
  const handleDelete = async (id: string) => {
    // await ProjectService.deleteProject(id);
    // await loadProjects();
  };

  const renderItem = ({ item }: { item: ProjectSummary }) => (
    <Card
      elevate
      size="$4"
      bordered
      animation="bouncy"
      scale={0.97}
      hoverStyle={{ scale: 1 }}
      pressStyle={{ scale: 0.95 }}
      onPress={() => handlePressProject(item.id)}
      mb="$3"
      bg="$background"
    >
      <Card.Header padded>
        <XStack ai="center" jc="space-between">
          <YStack flex={1}>
            <H3 size="$5" fontWeight="bold" numberOfLines={1}>
              {item.title}
            </H3>
            <XStack ai="center" mt="$2" opacity={0.6}>
              <Calendar size={14} />
              <Text ml="$1" fontSize="$3">
                {new Date(item.updatedAt).toLocaleDateString()}{" "}
                {new Date(item.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </XStack>
          </YStack>

          <Button
            size="$3"
            circular
            icon={Play}
            bg="$accent"
            color="white"
            onPress={() => handlePressProject(item.id)}
          />
        </XStack>
      </Card.Header>
    </Card>
  );

  return (
    <YStack f={1} bg="$background" pt={insets.top} px="$4">
      <H3 mb="$4" mt="$2" fontWeight="800">
        {" "}
        My (Projects)
      </H3>

      {projects.length === 0 ? (
        <YStack f={1} ai="center" jc="center" opacity={0.5}>
          <Text fontSize="$5">No Project Yet</Text>
          <Text fontSize="$3" mt="$2">
            Start recording your voice
          </Text>
        </YStack>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </YStack>
  );
}
