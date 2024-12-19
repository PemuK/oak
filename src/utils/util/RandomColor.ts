function generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';

    // 限制 RGB 值的范围在 128 到 255 (较亮)
    for (let i = 0; i < 3; i++) {
        const lightValue = 128 + Math.floor(Math.random() * 128); // 128 到 255
        color += letters[Math.floor(lightValue / 16)] + letters[lightValue % 16];
    }

    return color;
}

export { generateRandomColor };