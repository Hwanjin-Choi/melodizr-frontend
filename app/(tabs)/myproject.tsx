import React, { useState, useCallback } from "react";
import { FlatList, RefreshControl, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { YStack, Text, H3, Card, XStack, Button, Input } from "tamagui";
import { Play, Calendar, Pencil, Check, X, Trash } from "@tamagui/lucide-icons";
import { ProjectService, ProjectSummary } from "@/services/ProjectService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProjectPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

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
    if (editingId) return;
    router.push(`/record/${projectId}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project? All tracks will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ProjectService.deleteProject(id);
              await loadProjects();
            } catch (e) {
              Alert.alert("Error", "Failed to delete project");
            }
          },
        },
      ]
    );
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await ProjectService.renameProject(id, editTitle);
      await loadProjects();
      setEditingId(null);
    } catch (e) {
      console.error("Rename failed", e);
    }
  };

  const renderItem = ({ item }: { item: ProjectSummary }) => {
    const isEditing = editingId === item.id;

    return (
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
            <YStack flex={1} mr="$2">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChangeText={setEditTitle}
                  autoFocus
                  onSubmitEditing={() => saveTitle(item.id)}
                  size="$3"
                />
              ) : (
                <H3 size="$5" fontWeight="bold" numberOfLines={1}>
                  {item.title}
                </H3>
              )}

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

            <XStack gap="$2">
              {isEditing ? (
                <>
                  <Button
                    size="$3"
                    circular
                    icon={Check}
                    bg="$green8"
                    color="white"
                    onPress={() => saveTitle(item.id)}
                  />
                  <Button
                    size="$3"
                    circular
                    icon={X}
                    bg="$red8"
                    color="white"
                    onPress={cancelEditing}
                  />
                </>
              ) : (
                <>
                  <Button
                    size="$3"
                    circular
                    icon={Pencil}
                    bg="$gray5"
                    onPress={(e) => {
                      e.stopPropagation();
                      startEditing(item.id, item.title);
                    }}
                  />
                  <Button
                    size="$3"
                    circular
                    icon={Trash}
                    bg="$red8"
                    color="white"
                    onPress={(e) => {
                      e.stopPropagation(); // 카드 클릭 방지
                      handleDelete(item.id);
                    }}
                  />
                </>
              )}
            </XStack>
          </XStack>
        </Card.Header>
      </Card>
    );
  };

  return (
    <YStack f={1} bg="$background" pt={insets.top} px="$4">
      <H3 mb="$4" mt="$2" fontWeight="800">
        {" "}
        My Projects
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
