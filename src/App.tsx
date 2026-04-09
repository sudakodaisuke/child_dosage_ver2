import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import BottomNav from './components/layout/BottomNav'
import HomeScreen from './screens/HomeScreen'
import ImportScreen from './screens/ImportScreen'
import StudyModeScreen from './screens/StudyModeScreen'
import FlashcardModeScreen from './screens/FlashcardModeScreen'
import TestModeScreen from './screens/TestModeScreen'
import ResultsScreen from './screens/ResultsScreen'
import StatsScreen from './screens/StatsScreen'
import SettingsScreen from './screens/SettingsScreen'
import MatrixScreen from './screens/MatrixScreen'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex flex-col min-h-dvh">
          <div className="flex-1 pb-16">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/import" element={<ImportScreen />} />
              <Route path="/study" element={<StudyModeScreen />} />
              <Route path="/study/:category" element={<StudyModeScreen />} />
              <Route path="/flashcard" element={<FlashcardModeScreen />} />
              <Route path="/flashcard/:category" element={<FlashcardModeScreen />} />
              <Route path="/test" element={<TestModeScreen />} />
              <Route path="/test/:category" element={<TestModeScreen />} />
              <Route path="/results" element={<ResultsScreen />} />
              <Route path="/stats" element={<StatsScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/matrix" element={<MatrixScreen />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </HashRouter>
    </AppProvider>
  )
}
