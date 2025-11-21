import { StyleSheet, View } from "react-native";
import OnboardingScreen from "./OnboardingScreen";

export default function Index() {
  return (
    <View style={styles.container}>
      <OnboardingScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
