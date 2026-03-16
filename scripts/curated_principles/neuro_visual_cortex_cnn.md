---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 시각 피질, 합성곱 신경망, 수용 영역, 단순 세포, 복합 세포, 네오코그니트론, 계층적 특징 추출, 가중치 공유
keywords_en: visual cortex, convolutional neural network, receptive field, simple cell, complex cell, neocognitron, hierarchical feature extraction, weight sharing
---
Visual Cortex Hierarchy and Convolutional Neural Networks - 포유류 시각 피질의 계층적 특징 처리 구조에서 직접 영감을 받은 합성곱 신경망 아키텍처

## 시각 피질의 뉴런은 무엇을 보는가

1959년, 하버드 대학의 David Hubel과 Torsten Wiesel은 마취된 고양이의 시각 피질에 미세 전극을 삽입하고, 스크린에 다양한 빛 패턴을 투사하며 개별 뉴런의 전기 반응을 기록했다. 점 형태의 빛 자극으로는 뚜렷한 반응을 얻지 못하던 중, 슬라이드 교체 과정에서 유리 가장자리가 만든 직선 그림자에 특정 뉴런이 폭발적으로 발화하는 것을 우연히 발견했다.

후속 실험을 통해 시각 피질 뉴런이 두 가지 유형으로 나뉜다는 사실이 밝혀졌다.

- **단순 세포(simple cell)**: 시야의 특정 위치에서 특정 방향의 직선 에지에만 반응한다. 수평선 전용 뉴런, 45도 대각선 전용 뉴런이 별도로 존재한다. 에지가 수용 영역(receptive field) -- 하나의 뉴런이 반응하는 시야 영역 -- 안에서 수 도만 이동해도 반응이 급격히 떨어진다.
- **복합 세포(complex cell)**: 역시 특정 방향의 에지에 반응하지만, 에지가 수용 영역 내에서 어디에 위치하든 반응 강도가 유지된다. 방향에는 민감하되 위치에는 둔감한 **위치 불변성**(position invariance)을 보인다.

## 신경과학에서 알고리즘으로

시각 피질 모델이 컴퓨터 알고리즘으로 번역되기까지 세 번의 결정적 도약이 있었다.

- **Fukushima의 네오코그니트론(1980)**: Hubel-Wiesel 모델을 명시적으로 인용하며, S-세포층(단순 세포 대응)이 패턴을 감지하고 C-세포층(복합 세포 대응)이 위치 변동을 흡수하는 구조를 교대로 쌓았다. CNN의 원형이었지만, 비지도 학습 방식이어서 복잡한 패턴 분류에 한계가 있었다.
- **LeCun의 LeNet(1989, 1998)**: Fukushima의 구조에 **역전파(backpropagation)**를 결합했다. 합성곱 필터의 가중치를 경사하강법으로 직접 학습할 수 있게 만든 것이 핵심 혁신이다. LeNet-5(1998)는 미국 우편 시스템의 손글씨 우편번호 인식에 실전 배치되었다.
- **AlexNet(Krizhevsky et al., 2012)**: ImageNet 대회에서 top-5 오류율을 26%에서 16%로 떨어뜨리며 심층 CNN의 시대를 열었다. GPU 병렬 연산, ReLU, 드롭아웃을 결합하여 수천만 파라미터의 학습을 가능하게 했다.

시각 피질과 CNN의 핵심 대응 관계는 다음과 같다.

## 합성곱 연산의 메커니즘

CNN의 각 층에서는 작은 필터가 입력 위를 한 칸씩 슬라이딩하며 지역 특징을 추출한다. 출력 위치 (i,j)의 값은 다음과 같이 계산된다.

h_{i,j} = sigma( sum_m sum_n w_{m,n} * x_{i+m, j+n} + b )

필터 가중치 w가 입력의 지역 영역과 원소별 곱셈 후 합산되고, 편향 b가 더해지며, 활성화 함수 sigma(ReLU)가 비선형성을 부여한다. 동일한 필터가 모든 위치를 순회하는 것이 가중치 공유다.

가중치 공유의 효과는 극적이다. 224x224 입력에 3x3 필터를 쓸 때, 완전연결 층은 약 45만 개의 독립 가중치가 필요하지만 합성곱은 9개로 모든 위치를 처리한다. 5만 분의 1의 파라미터 절감이 CNN을 실용적으로 만든 핵심이다.

풀링(pooling)은 특징 맵의 공간 해상도를 줄인다. 2x2 max pooling은 인접 4개 값 중 최대값만 취해서 크기를 절반으로 줄인다. "수평 에지가 정확히 어디에 있는가"보다 "이 영역에 수평 에지가 존재하는가"가 보존되므로, 복합 세포의 위치 불변성과 기능적으로 대응된다.

## 지역성과 이동 불변성이라는 두 가지 베팅

CNN은 두 가지 강한 귀납적 편향(inductive bias)을 구조에 내장하고 있다.

- **공간적 지역성**: 인접 픽셀이 멀리 떨어진 픽셀보다 관련이 깊다. V1 뉴런이 시야의 좁은 영역에만 반응하는 것과 직접 대응된다.
- **이동 불변성**: 고양이가 이미지 왼쪽에 있든 오른쪽에 있든 같은 필터로 감지한다. 가중치 공유가 이를 가능하게 한다.

이 가정은 자연 이미지에 매우 효과적이지만, 체스판에서 특정 칸의 위치가 결정적이거나 의료 영상에서 병변의 위치가 진단에 핵심인 경우에는 이동 불변성이 오히려 필요한 위치 정보를 버리게 된다.

## 계층적 추상화가 효율적인 이유

"에지 -> 곡선 -> 귀/수염/발 -> 고양이"처럼 단계적으로 조합하면, 각 단계에서 소수의 패턴만 학습하면 된다. 이 **합성적 표현**(compositional representation) 덕분에 깊은 네트워크는 같은 함수를 얕은 네트워크보다 지수적으로 적은 뉴런으로 표현할 수 있다.

Yamins et al.(2014)은 ImageNet으로 학습된 CNN의 중간 레이어 활성화 패턴과 원숭이 시각 피질의 V4, IT 영역 뉴런 반응 사이에 높은 상관관계(약 0.5)를 발견했다. CNN이 시각 피질을 모방하려고 설계된 것이 아니라, 같은 과제(객체 인식)를 풀다 보니 유사한 내부 표현에 수렴한 것이다. CNN의 첫 번째 레이어는 V1 단순 세포와 유사한 에지 검출기를 학습하고, 중간 레이어는 텍스처를, 깊은 레이어는 전체 객체를 인식한다.

## 현대 AI 기법과의 연결

**시각 피질 모델의 직접적 영감:**

- **합성곱 + 풀링 구조 자체**: 단순 세포 -> 복합 세포의 교대 구조가 합성곱층 -> 풀링층의 직접적 원형이다. Fukushima(1980)가 Hubel-Wiesel을 명시적으로 인용했고, LeCun(1989)이 이를 계승했다
- **전이 학습(Transfer Learning)**: ImageNet으로 학습된 CNN의 얕은 층이 범용 에지/텍스처 검출기로 작동하여, 의료 영상이나 위성 사진 같은 전혀 다른 과제에 재사용된다. V1이 과제에 무관하게 기본 시각 특징을 처리하는 것과 기능적으로 대응된다

**동일한 구조적 원리를 독립적으로 공유:**

- **ResNet의 잔차 연결(He et al., 2015)**: skip connection으로 100층 이상의 학습을 가능하게 했다. 시각 피질에도 계층을 건너뛰는 연결이 존재하지만, ResNet은 시각 피질을 참조하지 않았다. 그래디언트 소실이라는 최적화 문제의 독립적 해결책이다
- **Vision Transformer(Dosovitskiy et al., 2020)**: 이미지를 16x16 패치로 분할하여 self-attention으로 처리한다. 합성곱의 귀납적 편향을 제거하고도 대규모 데이터에서 CNN을 능가했다. 시각 피질 영감의 계보에서 벗어난 독자적 접근이다

## 한계와 약점

- **피드백 연결의 부재**: 생물학적 시각 피질에서 상위 영역에서 하위로의 하향 피드백 연결은 상향 연결만큼 풍부하다. V1 입력의 약 80%가 상위 영역에서 온다. 표준 CNN은 순방향만 존재하며, 맥락 의존적 지각을 재현하지 못한다
- **역전파의 비생물학성**: 오차 신호가 모든 층을 역방향으로 정확히 전파되는 역전파는 생물학적 뉴런에 존재하지 않는다. 시각 피질의 학습은 지역적 시냅스 가소성에 기반한다
- **텍스처 편향**: Geirhos et al.(2019)은 CNN이 인간과 달리 형태(shape)보다 텍스처(texture)에 의존해 분류한다는 것을 보였다. 코끼리 피부 텍스처를 고양이 실루엣에 입히면 CNN은 "코끼리"라 분류하지만, 인간은 "고양이"라 답한다
- **적대적 취약성**: 인간이 감지할 수 없는 미세한 픽셀 변조로 CNN의 분류를 완전히 뒤집을 수 있다. 생물학적 시각 시스템은 이런 교란에 본질적으로 강건하다

## 용어 정리

시각 피질(visual cortex) - 후두엽에 위치한 대뇌 피질 영역으로, V1부터 IT까지 시각 정보를 계층적으로 처리

단순 세포(simple cell) - V1에서 특정 방향의 에지에, 특정 위치에서만 반응하는 뉴런. Hubel & Wiesel(1959) 발견

복합 세포(complex cell) - 특정 방향의 에지에 반응하되 수용 영역 내 위치에 무관하게 반응하는 뉴런. 위치 불변성의 생물학적 기반

수용 영역(receptive field) - 하나의 뉴런이 반응하는 시야 내의 영역. V1에서는 1~2도, IT에서는 시야 대부분을 차지

합성곱 필터(convolutional filter) - 입력 위를 슬라이딩하며 동일한 가중치로 지역 특징을 추출하는 CNN의 기본 연산 단위

풀링(pooling) - 특징 맵의 공간 해상도를 줄여 위치 불변성을 부여하는 연산. 복합 세포의 기능적 대응물

가중치 공유(weight sharing) - 동일한 필터 파라미터를 입력의 모든 공간 위치에 적용하는 것. 파라미터 수를 극적으로 줄이고 이동 불변성을 부여

귀납적 편향(inductive bias) - 모델 구조에 내장된 사전 가정. CNN의 경우 공간적 지역성과 이동 불변성이 해당
---EN---
Visual Cortex Hierarchy and Convolutional Neural Networks - A convolutional neural network architecture directly inspired by the hierarchical feature processing structure of the mammalian visual cortex

## What Visual Cortex Neurons See

In 1959, David Hubel and Torsten Wiesel at Harvard inserted microelectrodes into the visual cortex of anesthetized cats and recorded individual neurons' responses while projecting various light patterns. They serendipitously discovered that certain neurons fired vigorously in response to straight-edged shadows cast by a glass slide edge.

Follow-up experiments revealed two distinct neuron types:

- **Simple cells**: Respond to straight edges at a specific orientation at a specific location. Separate neurons exist for horizontal lines, 45-degree diagonals, etc. If the edge shifts even a few degrees within the receptive field -- the visual region to which a neuron responds -- the response drops sharply.
- **Complex cells**: Also respond to oriented edges, but maintain response regardless of position within their receptive field. Sensitive to orientation but tolerant to position -- this is **position invariance**.

## From Neuroscience to Algorithm

Three decisive leaps translated the visual cortex model into computer algorithms.

- **Fukushima's Neocognitron (1980)**: Explicitly citing Hubel-Wiesel, it alternated S-cell layers (simple cells) detecting patterns with C-cell layers (complex cells) absorbing positional variation. The CNN prototype, but limited by its unsupervised learning approach.
- **LeCun's LeNet (1989, 1998)**: Combined Fukushima's architecture with **backpropagation**. Making convolutional filter weights directly learnable through gradient descent was the key innovation. LeNet-5 was deployed for handwritten zip code recognition in the U.S. postal system.
- **AlexNet (Krizhevsky et al., 2012)**: Reduced ImageNet top-5 error from 26% to 16%, ushering in the deep CNN era. GPU parallelism, ReLU, and dropout enabled training tens of millions of parameters.

Key correspondences between visual cortex and CNNs:

## The Convolution Mechanism

In each CNN layer, a small filter slides across the input extracting local features. The output at position (i,j):

h_{i,j} = sigma( sum_m sum_n w_{m,n} * x_{i+m, j+n} + b )

Filter weights w multiply element-wise with a local input region, bias b is added, and activation function sigma (ReLU) introduces nonlinearity. The same filter traverses all positions -- weight sharing.

The effect is dramatic: for a 224x224 input with a 3x3 filter, a fully connected layer needs ~450,000 weights. Convolution uses just 9. This 50,000-fold reduction makes CNNs practical.

Pooling reduces feature map spatial resolution. 2x2 max pooling takes the maximum of 4 adjacent values, halving dimensions. It preserves "whether a horizontal edge exists" rather than "exactly where" -- functionally corresponding to complex cell position invariance.

## Two Bets: Locality and Translation Invariance

CNNs embed two strong inductive biases:

- **Spatial locality**: Adjacent pixels are more related than distant ones. Directly corresponds to V1 neurons' narrow receptive fields.
- **Translation invariance**: The same filter detects a cat regardless of image position. Weight sharing enables this.

These assumptions are highly effective for natural images but become constraints when specific position matters -- e.g., chessboard squares or medical imaging where lesion location is diagnostically critical.

## Why Hierarchical Abstraction Is Efficient

Composing "edges -> curves -> ears/whiskers/paws -> cat" in stages requires learning only a few patterns at each stage. This **compositional representation** allows deep networks to represent functions with exponentially fewer neurons than shallow ones.

Yamins et al. (2014) found that intermediate CNN layer activations correlate highly (~0.5) with monkey V4 and IT neuron responses. The CNN was not designed to mimic visual cortex -- solving the same task led to similar internal representations. CNN first layers learn V1-like edge detectors, middle layers capture textures, deep layers recognize whole objects.

## Connections to Modern AI

**Direct visual cortex inspiration:**

- **Convolution + pooling architecture**: The alternating simple -> complex cell structure is the direct prototype. Fukushima (1980) explicitly cited Hubel-Wiesel; LeCun (1989) inherited this lineage
- **Transfer learning**: Shallow CNN layers serve as general-purpose edge/texture detectors reusable for entirely different tasks, functionally corresponding to V1's task-independent feature processing

**Independent structural parallels:**

- **ResNet residual connections (He et al., 2015)**: Skip connections enabling 100+ layer training. Biological visual cortex has skip connections too, but ResNet independently solved the vanishing gradient problem
- **Vision Transformer (Dosovitskiy et al., 2020)**: Processing 16x16 image patches with self-attention. Surpassed CNNs on large-scale data without convolution's inductive bias -- departing from visual cortex lineage

## Limitations and Weaknesses

- **No feedback connections**: Biological top-down feedback connections are as abundant as feedforward ones; ~80% of V1 input comes from higher areas. Standard CNNs are purely feedforward, unable to reproduce context-dependent perception
- **Biological implausibility of backpropagation**: Error signals propagating backward through all layers with precision does not exist in biological neurons. Visual cortex learning relies on local synaptic plasticity
- **Texture bias**: Geirhos et al. (2019) showed CNNs rely on texture rather than shape, unlike humans. Elephant skin on a cat silhouette: CNN says "elephant," humans say "cat"
- **Adversarial vulnerability**: Imperceptible pixel perturbations can completely flip CNN classifications. Biological vision is inherently robust to such perturbations

## Glossary

Visual cortex - the cerebral cortex region in the occipital lobe that hierarchically processes visual information from V1 through IT

Simple cell - a V1 neuron responding to edges at a specific orientation only at a specific position. Discovered by Hubel & Wiesel (1959)

Complex cell - a neuron responding to oriented edges regardless of position within its receptive field. The biological basis of position invariance

Receptive field - the visual field region to which a neuron responds. Spans 1-2 degrees in V1, covering most of the visual field in IT

Convolutional filter - the basic CNN unit that slides across input with shared weights to extract local features

Pooling - an operation reducing feature map spatial resolution to confer position invariance. The functional counterpart of complex cells

Weight sharing - applying the same filter parameters to all spatial positions, dramatically reducing parameters and conferring translation invariance

Inductive bias - prior assumptions embedded in model architecture. For CNNs: spatial locality and translation invariance
