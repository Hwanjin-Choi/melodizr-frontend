import React, { useCallback, useMemo, useRef } from "react";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView, // 1. ScrollView 추가 임포트
} from "@gorhom/bottom-sheet";
import { Check, ChevronDown } from "@tamagui/lucide-icons";
import { Button, Text, YStack, XStack, useTheme } from "tamagui";
import { INSTRUMENT_OPTIONS } from "../hooks/useRecordControl";

interface InstrumentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const InstrumentSelector = ({
  value,
  onChange,
}: InstrumentSelectorProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const theme = useTheme();

  const snapPoints = useMemo(() => ["50%", "80%"], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleCloseModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const handleSelect = useCallback(
    (itemValue: string) => {
      onChange(itemValue);
      bottomSheetModalRef.current?.dismiss();
    },
    [onChange]
  );

  const currentLabel =
    INSTRUMENT_OPTIONS.find((opt) => opt.value === value)?.label ||
    "Select Instrument";

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <>
      <YStack gap="$2">
        <Text color="$grayText" fontSize="$3" ml="$1">
          Target Instrument
        </Text>
        <Button
          onPress={handlePresentModalPress}
          bg="$dark2"
          borderWidth={1}
          borderColor="$dark3"
          jc="space-between"
          iconAfter={<ChevronDown size={20} color="$grayText" />}
          pressStyle={{ bg: "$dark3" }}
        >
          <Text color="white" fontSize="$4">
            {currentLabel}
          </Text>
        </Button>
      </YStack>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints} // 3. 동적 사이즈 대신 고정 snapPoints 사용
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.dark2?.val || "#1E1E1E",
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.grayText?.val || "#888",
        }}
      >
        {/* 4. 전체를 BottomSheetView로 감싸고 내부 레이아웃 구성 */}
        <BottomSheetView style={{ flex: 1, padding: 16 }}>
          <Text
            color="$textPrimary"
            fontSize="$5"
            fontWeight="bold"
            textAlign="center"
            mb="$4"
          >
            Select Instrument
          </Text>

          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack gap="$2" mb="$4">
              {INSTRUMENT_OPTIONS.map((item) => {
                const isSelected = item.value === value;
                return (
                  <Button
                    key={item.value}
                    onPress={() => handleSelect(item.value)}
                    bg={isSelected ? "$dark3" : "transparent"}
                    borderColor={isSelected ? "$accent" : "$dark3"}
                    borderWidth={1}
                    jc="space-between"
                    height="$5"
                  >
                    <Text
                      color={isSelected ? "white" : "$grayText"}
                      fontWeight={isSelected ? "bold" : "normal"}
                      fontSize="$4"
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Check size={18} color="$accent" />}
                  </Button>
                );
              })}
            </YStack>
          </BottomSheetScrollView>

          <Button
            size="$5"
            bg="$red9"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleCloseModalPress}
            mt="$2"
            mb="$4"
          >
            <Text color="white" fontWeight="bold" fontSize="$4">
              Cancel
            </Text>
          </Button>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
};
