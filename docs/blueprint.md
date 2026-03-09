# **App Name**: RemoteDisplayLink

## Core Features:

- Control Panel Interface: A dedicated web interface for one device to present interactive 'ABCD' options, including a timer, a 'Next Question' button, and a 'Skip' button.
- Display Panel Interface: A dedicated web interface for a second device to clearly show the currently selected option, the timer, and 'Next Question' prompts.
- Real-time Selection Broadcasting: Instantly broadcast the user's selected 'ABCD' option from the control panel to a central service.
- Real-time Display Update: The display panel automatically updates in real-time to show the latest selected option or timer state from the control panel without refreshing.
- Question Timer & Full-Screen Display: A 1-minute 30-second countdown timer displayed prominently on both devices. On the display panel, the timer will show full screen until an option is chosen. After an option is chosen, the selected option will display full screen for 10 seconds.
- Next Question & Skip Functionality: Users on the control device can tap a 'Next Question' button, which will briefly appear on the display panel (2-3 seconds). A 'Skip' button allows users to skip the current question. The application will track answered and unanswered questions across 125 iterations.
- Question Progress Management: The application will remember which questions have not been answered yet and ensure the overall process iterates up to 125 times, managing skipped questions appropriately.

## Style Guidelines:

- Primary color: A muted yet distinct blue for focus and control, reflecting a modern and functional aesthetic. Hex: #3D80CC.
- Background color: A very light, desaturated blue to provide a clean and calm canvas, enhancing readability. Hex: #ECF2F7.
- Accent color: An energetic violet-blue that complements the primary color, suitable for highlighting interactive elements like the timer or active selections. Hex: #574AEF.
- Each 'ABCD' option on both the Control Panel and Display Panel will have a very distinct, vibrant color to differentiate them visually and provide clear feedback.
- Headline and body font: 'Inter' (sans-serif) for its modern, neutral, and highly readable characteristics, suitable for displaying options and controls on mobile devices.
- On the display panel, the timer and the selected option's text will use a very large, full-screen font size for maximum visibility from a distance.
- Use clear, universally recognizable icons for the 'ABCD' options, or simply bold, legible text. The display panel could use a distinct, large icon or text for the selected item, and clear icons for 'Next Question' and 'Skip'.
- Implement a responsive, mobile-first design for both control and display panels. The control panel should prioritize large, tappable buttons for 'ABCD', 'Next Question', and 'Skip'. The display panel should dynamically switch between full-screen timer, full-screen selected option, and a brief 'Next Question' prompt, all prominently centered.
- Incorporate subtle animations for feedback upon button presses on the control panel, a smooth transition when the displayed option changes on the display panel, and a clear, attention-grabbing animation for the 'Next Question' prompt on the display.