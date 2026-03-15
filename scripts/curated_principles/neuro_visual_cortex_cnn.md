---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 시각 피질, 합성곱 신경망, 수용 영역, 단순 세포, 복합 세포, 네오코그니트론, 계층적 특징 추출, 가중치 공유
keywords_en: visual cortex, convolutional neural network, receptive field, simple cell, complex cell, neocognitron, hierarchical feature extraction, weight sharing
---
Visual Cortex Hierarchy and Convolutional Neural Networks - 포유류 시각 피질의 계층적 특징 처리 구조에서 직접 영감을 받은 합성곱 신경망 아키텍처

## 시각 피질의 뉴런은 무엇을 보는가

1959년, 하버드 대학의 David Hubel과 Torsten Wiesel은 마취된 고양이의 후두엽 시각 피질(visual cortex)에 미세 전극을 삽입하고, 스크린에 다양한 빛 패턴을 투사하며 개별 뉴런의 전기 반응을 기록했다. 점 형태의 빛 자극으로는 뚜렷한 반응을 얻지 못하던 중, 슬라이드를 교체하는 과정에서 유리 가장자리가 만든 직선 그림자에 특정 뉴런이 폭발적으로 발화하는 것을 우연히 발견했다. 이 우연이 시각 신경과학의 방향을 바꾸었다.

후속 실험을 통해 시각 피질 뉴런이 두 가지 뚜렷한 유형으로 나뉜다는 사실이 밝혀졌다.

- **단순 세포(simple cell)**: 시야의 특정 위치에서 특정 방향의 직선 에지에만 반응한다. 수평선 전용 뉴런, 45도 대각선 전용 뉴런이 각각 별도로 존재한다. 에지가 수용 영역(receptive field) -- 하나의 뉴런이 반응하는 시야 영역 -- 안에서 수 도(degree)만 이동해도 반응이 급격히 떨어진다.
- **복합 세포(complex cell)**: 역시 특정 방향의 에지에 반응하지만, 에지가 수용 영역 내에서 어디에 위치하든 반응 강도가 유지된다. 방향에는 민감하되 위치에는 둔감한 것이다. 이 성질을 **위치 불변성**(position invariance)이라 부른다.

1962년 후속 연구에서 두 사람은 시각 피질이 단순한 뉴런 모음이 아니라 **엄격한 계층 구조**로 조직되어 있음을 보였다. V1(일차 시각 피질)에서 단순 세포가 에지를 감지하면, 그 신호가 복합 세포로 전달되어 위치에 무관한 에지 표현이 만들어진다. 더 상위 영역으로 올라갈수록 처리하는 정보가 추상화된다. V2는 윤곽과 텍스처 패턴, V4는 곡선과 색상 조합, 하측두 피질(IT cortex)은 얼굴이나 손 같은 고수준 객체를 표현한다.

이 계층 구조에서 핵심적인 성질이 하나 더 있다. 각 뉴런의 수용 영역 크기가 계층을 올라갈수록 커진다. V1 뉴런은 시야의 1~2도에만 반응하지만, IT 뉴런은 시야의 상당 부분을 덮는다. 작은 돋보기로 편지의 글자 하나를 보다가, 점점 멀리 떨어져서 편지 전체를 읽는 것을 상상하면 된다. "수용 영역이 점점 커지며, 정보가 점점 추상화되는" 이 패턴이 나중에 CNN 설계의 직접적 청사진이 된다.

마지막으로 시각 피질은 **레티노토피(retinotopic mapping)**를 유지한다. 망막에서 가까운 두 점은 피질에서도 가까이 표현된다. 공간적 이웃 관계가 보존되는 이 성질이, CNN이 이미지의 공간 구조를 그대로 유지하며 처리하는 설계의 생물학적 근거다. Hubel과 Wiesel은 이 발견들로 1981년 노벨 생리학 의학상을 수상했다.

## 신경과학에서 알고리즘으로

시각 피질 모델이 컴퓨터 알고리즘으로 번역되기까지 세 번의 결정적 도약이 있었다.

- **Fukushima의 네오코그니트론(Neocognitron, 1980)**: 일본의 후쿠시마 쿠니히코는 Hubel-Wiesel 모델을 명시적으로 인용하며 네오코그니트론을 설계했다. S-세포층(단순 세포 대응)이 특정 패턴을 감지하고, C-세포층(복합 세포 대응)이 위치 변동을 흡수하는 구조를 교대로 쌓았다. CNN의 원형이었지만, 학습이 비지도 방식 -- 각 세포가 자주 만나는 패턴에 자발적으로 특화 -- 이어서 복잡한 패턴 분류에 한계가 있었다.
- **LeCun의 LeNet(1989, 1998)**: Yann LeCun 등은 Fukushima의 구조에 **역전파(backpropagation)**를 결합했다. 합성곱 필터의 가중치를 경사하강법으로 직접 학습할 수 있게 만든 것이 핵심 혁신이다. LeNet-5(1998)는 미국 우편 시스템의 손글씨 우편번호 인식에 실전 배치되어, 하루 수백만 장의 우편물 분류에 사용되며 CNN의 실용성을 입증했다.
- **Krizhevsky, Sutskever, Hinton의 AlexNet(2012)**: ImageNet 대회에서 기존 최고 성능 대비 top-5 오류율을 26%에서 16%로 떨어뜨리며 심층 CNN의 시대를 열었다. GPU 병렬 연산, ReLU 활성화 함수, 드롭아웃을 결합하여 수천만 파라미터의 심층 CNN 학습을 가능하게 한 것이 기술적 돌파구였다.

시각 피질과 CNN 사이의 핵심 대응 관계는 다음과 같다.

- 단순 세포 (특정 방향 에지 감지, 위치 민감) --> **합성곱 필터** (학습된 특징 검출기)
- 복합 세포 (위치 불변 반응) --> **풀링 레이어** (max/average pooling으로 위치 변동 흡수)
- 수용 영역의 계층적 확대 --> **깊은 레이어 = 더 큰 수용 영역** (3x3 필터를 3개 쌓으면 7x7 영역을 봄)
- V1 -> V2 -> V4 -> IT 계층 --> **얕은 층(에지) -> 중간 층(텍스처, 부분) -> 깊은 층(전체 객체)**
- 레티노토피 --> **특징 맵이 입력의 공간 배치를 유지** (합성곱의 공간 구조 보존)
- 같은 유형의 단순 세포가 시야 전역에 분포 --> **가중치 공유** (동일 필터가 모든 위치를 슬라이딩)

## 합성곱 연산의 메커니즘

CNN의 각 층에서는 작은 필터가 입력 위를 한 칸씩 슬라이딩하며 지역 특징을 추출한다. 2D 특징 맵(feature map)에서 출력 위치 (i,j)의 값은 다음과 같이 계산된다.

h_{i,j} = sigma( sum_m sum_n w_{m,n} * x_{i+m, j+n} + b )

1. 필터 가중치 w_{m,n}이 입력 x의 지역 영역과 원소별 곱셈 후 합산된다
2. 편향 b가 더해진다
3. 활성화 함수 sigma(현대 CNN에서는 거의 ReLU)가 비선형성을 부여한다
4. 동일한 필터가 모든 위치를 순회한다 -- 이것이 가중치 공유다

가중치 공유의 효과를 구체적 숫자로 보자. 입력 이미지가 224x224이고 필터 크기가 3x3이면, 완전연결 층은 224 * 224 * 3 * 3 = 약 45만 개의 독립 가중치가 필요하다. 합성곱은 3 * 3 = 9개의 가중치로 모든 위치를 처리한다. 파라미터 수가 5만 분의 1로 줄어드는 것이다. 이 극적인 절감이 CNN을 실용적으로 만든 핵심 요소다. 생물학적으로는 같은 유형의 단순 세포가 망막의 여러 위치에 동일한 기능으로 분포하는 것에 대응된다.

풀링(pooling) 연산은 특징 맵의 공간 해상도를 줄인다. 예를 들어 2x2 max pooling은 인접 4개 값 중 최대값만 취해서 특징 맵의 크기를 가로, 세로 각각 절반으로 줄인다. "수평 에지가 정확히 어디에 있는가"보다 "이 영역에 수평 에지가 존재하는가"라는 정보가 보존되므로, 복합 세포의 위치 불변성과 기능적으로 대응된다.

## 지역성과 이동 불변성이라는 두 가지 베팅

CNN은 두 가지 강한 사전 가정(귀납적 편향, inductive bias)을 구조에 내장하고 있다.

- **공간적 지역성(spatial locality)**: 인접 픽셀들이 멀리 떨어진 픽셀보다 서로 더 관련이 깊다. 3x3 필터가 한 번에 보는 것은 9개 인접 픽셀뿐이다. 이것은 V1 뉴런이 시야의 좁은 영역에만 반응하는 것과 직접 대응된다.
- **이동 불변성(translation invariance)**: 고양이가 이미지 왼쪽에 있든 오른쪽에 있든, 같은 필터로 감지할 수 있다. 가중치를 공유하기 때문에 위치에 무관하게 동일한 특징을 추출한다.

이 두 가정은 자연 이미지에 대해 매우 효과적이다. 풍경 사진, 동물 사진, 일상 장면에서는 "가까운 픽셀이 관련 있고, 같은 물체는 어디에 있든 같은 물체다"라는 가정이 거의 항상 성립하기 때문이다. 하지만 이것이 제약이 되는 경우도 있다. 체스판에서 특정 칸의 위치가 결정적으로 중요하거나, 의료 영상에서 병변이 장기의 어느 위치에 있는지가 진단에 핵심인 과제에서는 이동 불변성이 오히려 필요한 위치 정보를 버리게 된다.

## 계층적 추상화가 효율적인 이유

시각 피질이 왜 계층 구조를 사용하는지, 그리고 CNN에서 이 구조가 왜 효과적인지에 대한 이론적 설명이 있다.

깊은 네트워크는 같은 함수를 표현하는 데 얕은 네트워크보다 지수적으로 적은 뉴런을 사용할 수 있다. 직관적으로 생각하면 이렇다. "왼쪽 위에 동그란 귀, 중앙에 수염, 아래에 발"이라는 조합을 한 번에 인식하려면, 귀-수염-발의 가능한 모든 위치 조합을 일일이 외워야 한다. 하지만 "에지 -> 곡선 -> 귀/수염/발 -> 고양이"처럼 단계적으로 조합하면, 각 단계에서 소수의 패턴만 학습하면 된다. 이것을 **합성적 표현**(compositional representation)이라 하며, 자연 이미지가 이런 합성 구조를 가지고 있기 때문에 계층적 아키텍처가 특히 잘 작동한다.

Yamins et al.(2014)은 ImageNet으로 학습된 CNN의 중간 레이어 활성화 패턴과 원숭이 시각 피질의 V4, IT 영역 뉴런 반응 사이에 높은 상관관계(상관계수 약 0.5)가 있다는 것을 발견했다. CNN이 시각 피질을 모방하려고 설계된 것이 아니라, 같은 과제(객체 인식)를 풀다 보니 유사한 내부 표현에 수렴한 것이다. Zeiler & Fergus(2014)의 시각화 연구도 같은 방향을 가리킨다. CNN의 첫 번째 레이어는 Gabor 필터(방향성 주파수 패턴 검출기)와 유사한 에지 검출기를 학습하고 -- V1 단순 세포의 반응 패턴과 놀랍도록 유사하다 -- 중간 레이어는 텍스처와 부분 패턴을, 깊은 레이어는 전체 객체를 인식한다. 이 결과는 계층적 특징 추출이 시각 과제에 대한 일종의 보편적 해법일 가능성을 시사한다.

## 현대 AI 기법과의 연결

시각 피질에서 출발한 CNN은 여러 방향으로 진화했다. 각 연결의 성격을 구분하면 다음과 같다.

**시각 피질 모델의 직접적 영감:**

- **합성곱 + 풀링 구조 자체**: 단순 세포 -> 복합 세포의 교대 구조가 합성곱층 -> 풀링층의 직접적 원형이다. Fukushima(1980)의 네오코그니트론 논문이 Hubel-Wiesel을 명시적으로 인용했고, LeCun(1989)이 이를 계승했다. 이것은 문서화된 직접적 영감이다.
- **전이 학습(Transfer Learning)의 성공**: ImageNet으로 학습된 CNN의 얕은 층이 범용 에지/텍스처 검출기로 작동하여, 전혀 다른 시각 과제(예: 의료 영상, 위성 사진)에 재사용된다. 시각 피질의 V1이 과제에 무관하게 기본 시각 특징을 처리하는 것과 기능적으로 대응되며, 계층적 특징 추출이라는 설계 원리의 직접적 결과다.

**동일한 구조적 원리를 독립적으로 공유하는 사례:**

- **ResNet의 잔차 연결(He et al., 2015)**: 입력을 건너뛰어 더 깊은 층에 직접 전달하는 skip connection으로 100층 이상의 학습을 가능하게 했다. 생물학적 시각 피질에도 계층을 건너뛰는 연결이 존재하지만, ResNet은 시각 피질을 참조하지 않았다. 그래디언트 소실(gradient vanishing)이라는 최적화 문제의 독립적 해결책이다.
- **Vision Transformer(Dosovitskiy et al., 2020)**: 이미지를 16x16 패치로 분할하여 Transformer의 self-attention으로 처리한다. 합성곱이라는 귀납적 편향을 제거하고도 대규모 데이터에서 CNN을 능가했다. 시각 피질 영감의 직접적 계보에서 벗어난 독자적 접근이지만, "작은 조각에서 더 넓은 맥락으로"라는 계층적 통합의 흐름은 결과적으로 유사하다.

## 한계와 약점

- **피드백 연결의 부재**: 생물학적 시각 피질에서 상위 영역에서 하위 영역으로의 하향(top-down) 피드백 연결은 상향 연결만큼 풍부하다. V1으로 가는 입력의 약 80%가 상위 영역에서 오는 것으로 추정된다. 표준 CNN은 순방향(feedforward)만 존재하며, 맥락 의존적 지각 -- 예컨대 "이것은 사과일 것이다"라는 기대가 지각을 실제로 바꾸는 현상 -- 을 재현하지 못한다.
- **역전파의 비생물학성**: CNN 학습에 사용되는 역전파는 오차 신호가 모든 층을 역방향으로 정확히 전파되어야 한다. 생물학적 뉴런에는 이런 메커니즘이 존재하지 않는다. 시각 피질의 학습은 지역적 시냅스 가소성 -- 인접 뉴런 간 연결 강도를 활동 패턴에 따라 조정하는 것 -- 에 기반한다.
- **텍스처 편향**: Geirhos et al.(2019)은 ImageNet으로 학습된 CNN이 인간과 달리 형태(shape)보다 텍스처(texture)에 의존해 분류한다는 것을 보였다. 코끼리 피부 텍스처를 고양이 실루엣에 입히면 CNN은 "코끼리"라 분류하지만, 인간은 여전히 "고양이"라 답한다. CNN이 시각 피질과 근본적으로 다른 인식 전략을 사용하고 있음을 시사한다.
- **적대적 취약성**: 인간이 감지할 수 없는 미세한 픽셀 변조(노이즈 크기 0.01 수준)로 CNN의 분류를 완전히 뒤집을 수 있다. 판다 이미지에 특정 패턴 노이즈를 더하면 99% 확신으로 "긴팔원숭이"라 분류하는 식이다. 생물학적 시각 시스템은 이런 종류의 교란에 본질적으로 강건하다.

## 용어 정리

시각 피질(visual cortex) - 후두엽에 위치한 대뇌 피질 영역으로, 시각 정보를 V1부터 IT까지 계층적으로 처리하는 뇌 구조

단순 세포(simple cell) - V1 시각 피질에서 특정 방향의 에지에, 특정 위치에서만 반응하는 뉴런. Hubel & Wiesel(1959)이 발견

복합 세포(complex cell) - 특정 방향의 에지에 반응하되 수용 영역 내 위치에 무관하게 반응하는 뉴런. 위치 불변성의 생물학적 기반

수용 영역(receptive field) - 하나의 뉴런이 반응하는 시야 내의 영역. V1에서는 1~2도, IT에서는 시야 대부분을 차지하며, CNN에서는 한 뉴런의 출력에 영향을 미치는 입력 영역을 가리킨다

레티노토피(retinotopy) - 망막의 공간 배치가 시각 피질에서도 이웃 관계를 유지하며 대응되는 위상 구조

합성곱 필터(convolutional filter) - 입력 위를 슬라이딩하며 동일한 가중치로 지역 특징을 추출하는 CNN의 기본 연산 단위. 하나의 필터가 하나의 특징 맵을 생성한다

풀링(pooling) - 특징 맵의 공간 해상도를 줄여 위치 불변성을 부여하는 연산. 복합 세포의 기능적 대응물. max pooling은 최대값을, average pooling은 평균값을 취한다

가중치 공유(weight sharing) - 동일한 필터 파라미터를 입력의 모든 공간 위치에 적용하는 것. 파라미터 수를 극적으로 줄이고 이동 불변성을 부여한다

귀납적 편향(inductive bias) - 모델 구조에 내장된 사전 가정. CNN의 경우 공간적 지역성과 이동 불변성이 해당하며, 적합한 문제에서는 학습 효율을 높이지만 부적합한 문제에서는 제약이 된다

합성적 표현(compositional representation) - 복잡한 패턴을 단순한 부분들의 조합으로 표현하는 방식. "에지 -> 곡선 -> 부분 -> 전체 객체"처럼 단계적으로 구성된다
---EN---
Visual Cortex Hierarchy and Convolutional Neural Networks - A convolutional neural network architecture directly inspired by the hierarchical feature processing structure of the mammalian visual cortex

## What Visual Cortex Neurons See

In 1959, neuroscientists David Hubel and Torsten Wiesel at Harvard inserted microelectrodes into the visual cortex in the occipital lobe of anesthetized cats and recorded individual neurons' electrical responses while projecting various light patterns onto a screen. Point-like light stimuli produced no clear responses, but they serendipitously discovered that certain neurons fired vigorously in response to the straight-edged shadow cast by the edge of a glass slide being swapped. This accident changed the direction of visual neuroscience.

Follow-up experiments revealed that visual cortex neurons fall into two distinct types:

- **Simple cells**: Respond to straight edges at a specific orientation at a specific location in the visual field. Separate neurons exist for horizontal lines, for 45-degree diagonals, and so on. If the edge shifts by even a few degrees within the receptive field -- the region of the visual field to which a single neuron responds -- the response drops sharply.
- **Complex cells**: Also respond to edges at a specific orientation, but maintain their response strength regardless of where the edge falls within their receptive field. They are sensitive to orientation but tolerant to position. This property is called **position invariance**.

In their 1962 follow-up study, the pair showed that the visual cortex is organized as a **strict hierarchy**, not a mere collection of neurons. When simple cells in V1 (primary visual cortex) detect edges, these signals feed into complex cells that create position-invariant edge representations. Ascending the hierarchy, the information processed becomes more abstract. V2 handles contours and texture patterns, V4 recognizes curves and color combinations, and the inferotemporal cortex (IT) represents high-level objects like faces and hands.

One more critical property of this hierarchy: each neuron's receptive field grows larger at higher levels. V1 neurons respond to just 1-2 degrees of visual angle, while IT neurons cover a substantial portion of the visual field. Imagine examining a single letter through a small magnifying glass, then stepping back until you can read the entire letter. This pattern of "receptive fields growing larger while information becomes more abstract" later became the direct blueprint for CNN design.

The visual cortex also maintains **retinotopic mapping**: adjacent points on the retina are represented adjacently in the cortex. This preservation of spatial neighbor relationships is the biological basis for CNNs' design of preserving spatial structure during image processing. Hubel and Wiesel received the 1981 Nobel Prize in Physiology or Medicine for these discoveries.

## From Neuroscience to Algorithm

Three decisive leaps were required to translate the visual cortex model into computer algorithms.

- **Fukushima's Neocognitron (1980)**: Japan's Kunihiko Fukushima explicitly cited the Hubel-Wiesel model in designing the Neocognitron. S-cell layers (corresponding to simple cells) detected specific patterns, and C-cell layers (corresponding to complex cells) absorbed positional variation, alternating in a stack. This was the conceptual prototype of CNNs, but its unsupervised learning rule -- each cell spontaneously specializing in frequently encountered patterns -- limited its ability to classify complex patterns.
- **LeCun's LeNet (1989, 1998)**: Yann LeCun et al. combined Fukushima's architecture with **backpropagation**. The key innovation was making convolutional filter weights directly learnable through gradient descent. LeNet-5 (1998) was deployed in the U.S. postal system for handwritten zip code recognition, processing millions of pieces of mail daily and proving CNN's practical viability.
- **Krizhevsky, Sutskever, Hinton's AlexNet (2012)**: Reduced the top-5 error rate on ImageNet from 26% to 16% compared to the previous best, ushering in the era of deep CNNs. The combination of GPU parallelism, ReLU activation, and dropout made training deep CNNs with tens of millions of parameters technically feasible.

The key correspondences between the visual cortex and CNNs are:

- Simple cells (orientation-specific edge detection, position-sensitive) --> **convolutional filters** (learned feature detectors)
- Complex cells (position-invariant response) --> **pooling layers** (max/average pooling absorbs positional variation)
- Hierarchical increase in receptive field size --> **deeper layers = larger receptive fields** (stacking three 3x3 filters covers a 7x7 region)
- V1 -> V2 -> V4 -> IT hierarchy --> **shallow layers (edges) -> middle layers (textures, parts) -> deep layers (whole objects)**
- Retinotopic mapping --> **feature maps preserve the input's spatial arrangement** (spatial structure preservation in convolution)
- Same type of simple cells distributed across the visual field --> **weight sharing** (the same filter slides across all positions)

## The Convolution Mechanism

In each CNN layer, a small filter slides across the input one step at a time, extracting local features. For a 2D feature map, the value at each output position (i,j) is computed as:

h_{i,j} = sigma( sum_m sum_n w_{m,n} * x_{i+m, j+n} + b )

1. Filter weights w_{m,n} are multiplied element-wise with a local region of the input x, then summed
2. A bias b is added
3. An activation function sigma (nearly always ReLU in modern CNNs) introduces nonlinearity
4. The same filter traverses all positions -- this is weight sharing

To see the effect of weight sharing in concrete numbers: for a 224x224 input image with a 3x3 filter, a fully connected layer would need 224 * 224 * 3 * 3, roughly 450,000 independent weights. Convolution processes all positions with just 3 * 3 = 9 weights. That is a 50,000-fold reduction in parameters. This dramatic reduction is a key factor that makes CNNs practical. Biologically, it corresponds to the same type of simple cells being distributed with identical function across multiple locations on the retina.

The pooling operation reduces the spatial resolution of feature maps. For example, 2x2 max pooling takes only the maximum of 4 adjacent values, halving the feature map size in both height and width. What is preserved is whether a horizontal edge exists in this region, rather than exactly where it is -- functionally corresponding to the position invariance of complex cells.

## Two Bets: Locality and Translation Invariance

CNNs embed two strong prior assumptions (inductive biases) in their architecture:

- **Spatial locality**: Adjacent pixels are more related to each other than distant ones. A 3x3 filter examines only 9 neighboring pixels at a time. This directly corresponds to V1 neurons responding only to a narrow region of the visual field.
- **Translation invariance**: A cat can be detected by the same filter whether it appears on the left or right of the image. Weight sharing enables extracting the same features regardless of position.

These two assumptions are highly effective for natural images. In landscape photos, animal pictures, and everyday scenes, the assumption that "nearby pixels are related, and the same object is the same object wherever it appears" almost always holds. However, they can become constraints. In tasks where a specific square's position on a chessboard is decisive, or where the location of a lesion within an organ is critical for medical diagnosis, translation invariance actually discards essential positional information.

## Why Hierarchical Abstraction Is Efficient

There is a theoretical explanation for why the visual cortex uses a hierarchical structure and why this structure is effective in CNNs.

Deep networks can represent the same function using exponentially fewer neurons than shallow networks. Intuitively: recognizing the combination "round ears at top-left, whiskers at center, paws below" by brute force requires memorizing all possible positional arrangements of ears, whiskers, and paws. But decomposing it as "edges -> curves -> ears/whiskers/paws -> cat" requires learning only a small number of patterns at each stage. This is called **compositional representation**, and hierarchical architectures work particularly well because natural images possess this compositional structure.

Yamins et al. (2014) found that intermediate layer activations of ImageNet-trained CNNs showed high correlation (correlation coefficients around 0.5) with neuron responses in monkey visual cortex areas V4 and IT. The CNN was not designed to mimic the visual cortex -- rather, solving the same task (object recognition) led it to converge on similar internal representations. Zeiler & Fergus's (2014) visualization study points in the same direction: a CNN's first layer learns edge detectors resembling Gabor filters (orientation-sensitive frequency pattern detectors) -- strikingly similar to V1 simple cell response patterns -- middle layers capture textures and partial patterns, and deep layers recognize whole objects. These results suggest that hierarchical feature extraction may be a universal solution to visual tasks.

## Connections to Modern AI

CNNs that originated from visual cortex inspiration have evolved in multiple directions. Distinguishing the nature of each connection:

**Direct inspiration from the visual cortex model:**

- **The convolution + pooling architecture itself**: The alternating simple cell -> complex cell structure is the direct prototype for convolution layers -> pooling layers. Fukushima's (1980) Neocognitron paper explicitly cited Hubel-Wiesel, and LeCun (1989) inherited this lineage. This is documented direct inspiration.
- **The success of transfer learning**: Shallow layers of ImageNet-trained CNNs function as general-purpose edge/texture detectors that can be reused for entirely different visual tasks (e.g., medical imaging, satellite imagery). This functionally corresponds to V1 processing basic visual features regardless of task, and is a direct consequence of the hierarchical feature extraction design principle.

**Structural similarities sharing the same principle independently:**

- **ResNet's residual connections (He et al., 2015)**: Skip connections that pass input directly to deeper layers, enabling training of networks with over 100 layers. While skip connections exist in the biological visual cortex, ResNet did not reference the visual cortex. It was an independent solution to an optimization problem (vanishing gradients).
- **Vision Transformer (Dosovitskiy et al., 2020)**: Splits images into 16x16 patches and processes them with Transformer self-attention. It surpassed CNNs on large-scale data even after removing convolution's inductive bias -- an independent approach departing from the direct visual cortex lineage. However, the hierarchical integration flow of "small pieces -> broader context" ends up being similar in outcome.

## Limitations and Weaknesses

- **Absence of feedback connections**: In the biological visual cortex, top-down feedback connections from higher to lower areas are as abundant as feedforward ones. An estimated 80% of input to V1 comes from higher areas. Standard CNNs are purely feedforward, which is why they cannot reproduce context-dependent perception -- for example, the phenomenon where expecting "this is an apple" actually alters perception.
- **Biological implausibility of backpropagation**: Backpropagation used for CNN training requires error signals to propagate backward through all layers with exact precision. Biological neurons have no such mechanism. Visual cortex learning relies on local synaptic plasticity -- adjusting connection strengths between adjacent neurons based on activity patterns.
- **Texture bias**: Geirhos et al. (2019) showed that ImageNet-trained CNNs rely on texture rather than shape for classification, unlike humans. When elephant skin texture is applied to a cat silhouette, CNNs classify it as "elephant" while humans still answer "cat." This suggests CNNs employ a fundamentally different recognition strategy from the visual cortex.
- **Adversarial vulnerability**: Imperceptible pixel perturbations (noise magnitude on the order of 0.01) can completely flip CNN classifications. Adding a specific noise pattern to a panda image causes 99% confident classification as "gibbon." The biological visual system is inherently robust to this kind of perturbation.

## Glossary

Visual cortex - the cerebral cortex region in the occipital lobe that hierarchically processes visual information from V1 through IT

Simple cell - a V1 visual cortex neuron that responds to edges at a specific orientation only at a specific position. Discovered by Hubel & Wiesel (1959)

Complex cell - a neuron that responds to edges at a specific orientation regardless of position within its receptive field. The biological basis of position invariance

Receptive field - the region of the visual field to which a single neuron responds. Spans 1-2 degrees in V1, covering most of the visual field in IT. In CNNs, it refers to the input region that influences a single neuron's output

Retinotopy - the topographic correspondence where the spatial arrangement on the retina is preserved with neighbor relationships maintained in the visual cortex

Convolutional filter - the basic computational unit of a CNN that slides across input with shared weights to extract local features. A single filter produces a single feature map

Pooling - an operation that reduces spatial resolution of feature maps to confer position invariance. The functional counterpart of complex cells. Max pooling takes the maximum value; average pooling takes the mean

Weight sharing - applying the same filter parameters to all spatial positions of the input. Dramatically reduces parameter count and confers translation invariance

Inductive bias - prior assumptions embedded in model architecture. For CNNs, these are spatial locality and translation invariance, which improve learning efficiency on suitable problems but become constraints on unsuitable ones

Compositional representation - representing complex patterns as combinations of simple parts. Constructed in stages like "edges -> curves -> parts -> whole objects"
