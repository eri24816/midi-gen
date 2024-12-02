<template>
    <p><b>Create your own music. Ask AI for help whenever you need.</b></p>
    <p>
        Left click to add notes. Right click to remove notes. Click [play] to play the music.
    </p>
    <p>
        Under the editor is the attribute panel. Click [generate] to let AI generate music for the bar.
        Set the attributes before clicking [generate] to control the AI's output.
    </p>
    <p>
        When an attribute is yellow, it means it is controlled by the user. Right click on it to unset it.
    </p>
    <h2>How does it work?</h2>
    <p>
        To generate the current bar, the AI takes the notes you (or the AI itself) have composed in the previous 15 bars as context. It also takes the attributes you have set as control.
        If some attributes are not set, the AI will decide their values.
    </p>
</template>