import * as WebBrowser from 'expo-web-browser';

export async function openArticle(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    toolbarColor: '#0a0a0a',
    controlsColor: '#5EEAD4',
  });
}
