import React, { useCallback, useMemo, useRef } from "react";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
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
        pressBehavior="close" // 배경 클릭 시 닫기 (원치 않으시면 'none'으로 변경)
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
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.dark2?.val || "#1E1E1E",
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.grayText?.val || "#888",
        }}
      >
        <BottomSheetView style={{ padding: 16, paddingBottom: 32 }}>
          <Text
            color="$textPrimary"
            fontSize="$5"
            fontWeight="bold"
            textAlign="center"
            mb="$4"
          >
            Select Instrument
          </Text>
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
          <Button
            size="$5"
            bg="$red9"
            pressStyle={{ opacity: 0.8 }}
            onPress={handleCloseModalPress}
            mt="$2"
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
